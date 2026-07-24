import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@xyflow/react/dist/style.css';
import { explorerAreasById, explorerGraph, explorerNodesById } from '../../data/explorer';
import './ExplorerApp.css';

type ExplorerNodeKind = 'area' | 'business';

interface ExplorerNodeData extends Record<string, unknown> {
  kind: ExplorerNodeKind;
  id: string;
  label: string;
  dimmed?: boolean;
  expanded?: boolean;
  onFocus?: (id: string) => void;
  onToggle?: (id: string) => void;
}

type ExplorerFlowNode = Node<ExplorerNodeData, ExplorerNodeKind>;

const AREA_COLUMNS = 6;
const AREA_X_GAP = 420;
const AREA_Y_GAP = 390;
const AREA_ORIGIN_X = 170;
const AREA_ORIGIN_Y = 170;
const OPEN_DELAY = 150;
const CLOSE_DELAY = 250;

const businessAreas = [...explorerGraph.businessAreas].sort((left, right) => left.order - right.order);

function areaPosition(index: number) {
  return {
    x: AREA_ORIGIN_X + (index % AREA_COLUMNS) * AREA_X_GAP,
    y: AREA_ORIGIN_Y + Math.floor(index / AREA_COLUMNS) * AREA_Y_GAP,
  };
}

function businessPositions(count: number) {
  const positions: Array<{ x: number; y: number }> = [];
  const rings = count <= 8 ? [count] : [6, count - 6];
  let offset = 0;

  rings.forEach((ringCount, ringIndex) => {
    const radius = ringIndex === 0 ? 175 : 290;
    const angleOffset = ringIndex === 0 ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / ringCount;
    for (let index = 0; index < ringCount; index += 1) {
      const angle = angleOffset + (Math.PI * 2 * index) / ringCount;
      positions[offset + index] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    }
    offset += ringCount;
  });

  return positions;
}

function ExplorerNodeCard({ data }: NodeProps<ExplorerFlowNode>) {
  const label = `${data.id} ${data.label}`;
  if (data.kind === 'business') {
    return (
      <div className="explorer-business-node" role="group" aria-label={`業務 ${label}`}>
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={false}
          style={{ opacity: 0, pointerEvents: 'none' }}
        />
        <span>{data.id}</span>
        <strong>{data.label}</strong>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`explorer-area-node${data.expanded ? ' is-expanded' : ''}${data.dimmed ? ' is-dimmed' : ''}`}
      aria-label={`${data.id} 業務領域「${data.label}」`}
      aria-expanded={data.expanded}
      onFocus={() => data.onFocus?.(data.id)}
      onClick={() => data.onToggle?.(data.id)}
    >
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      <span>{data.id}</span>
      <strong>{data.label}</strong>
    </button>
  );
}

const nodeTypes = {
  area: ExplorerNodeCard,
  business: ExplorerNodeCard,
};

function ExplorerCanvas() {
  const [expandedAreaId, setExpandedAreaId] = useState<string>();
  const { fitView } = useReactFlow<ExplorerFlowNode>();
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const clearOpenTimer = useCallback(() => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    openTimer.current = null;
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const openArea = useCallback((areaId: string, delayed = false) => {
    clearOpenTimer();
    clearCloseTimer();
    if (!delayed) {
      setExpandedAreaId(areaId);
      return;
    }
    openTimer.current = window.setTimeout(() => setExpandedAreaId(areaId), OPEN_DELAY);
  }, [clearCloseTimer, clearOpenTimer]);

  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setExpandedAreaId(undefined), CLOSE_DELAY);
  }, [clearCloseTimer, clearOpenTimer]);

  useEffect(() => () => {
    clearOpenTimer();
    clearCloseTimer();
  }, [clearCloseTimer, clearOpenTimer]);

  const toggleArea = useCallback((areaId: string) => {
    clearOpenTimer();
    clearCloseTimer();
    setExpandedAreaId((current) => current === areaId ? undefined : areaId);
  }, [clearCloseTimer, clearOpenTimer]);

  const nodes = useMemo<ExplorerFlowNode[]>(() => {
    const areaNodes = businessAreas.map((area, index): ExplorerFlowNode => ({
      id: area.id,
      type: 'area',
      position: areaPosition(index),
      draggable: false,
      selectable: false,
      data: {
        kind: 'area',
        id: area.id,
        label: area.label,
        expanded: area.id === expandedAreaId,
        dimmed: Boolean(expandedAreaId && area.id !== expandedAreaId),
        onFocus: openArea,
        onToggle: toggleArea,
      },
    }));

    if (!expandedAreaId) return areaNodes;
    const area = explorerAreasById.get(expandedAreaId);
    const parent = areaNodes.find((node) => node.id === expandedAreaId);
    if (!area || !parent) return areaNodes;
    const offsets = businessPositions(area.businessIds.length);

    return [
      ...areaNodes,
      ...area.businessIds.flatMap((businessId, index): ExplorerFlowNode[] => {
        const business = explorerNodesById.get(businessId);
        if (!business) return [];
        return [{
          id: business.id,
          type: 'business',
          position: {
            x: parent.position.x + offsets[index].x,
            y: parent.position.y + offsets[index].y,
          },
          draggable: false,
          selectable: false,
          data: {
            kind: 'business',
            id: business.id,
            label: business.label,
          },
        }];
      }),
    ];
  }, [expandedAreaId, openArea, toggleArea]);

  const edges = useMemo<Edge[]>(() => {
    const area = expandedAreaId ? explorerAreasById.get(expandedAreaId) : undefined;
    if (!area) return [];
    return area.businessIds.map((businessId) => ({
      id: `${area.id}-${businessId}`,
      source: area.id,
      target: businessId,
      type: 'straight',
      selectable: false,
      style: { strokeWidth: 2.5 },
      className: 'explorer-business-edge',
    }));
  }, [expandedAreaId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (expandedAreaId) {
        const area = explorerAreasById.get(expandedAreaId);
        const visibleIds = new Set([expandedAreaId, ...(area?.businessIds ?? [])]);
        void fitView({
          nodes: nodes.filter((node) => visibleIds.has(node.id)),
          padding: 0.18,
          minZoom: 0.45,
          maxZoom: 1,
          duration: 220,
        });
      } else {
        void fitView({ nodes, padding: 0.13, minZoom: 0.35, maxZoom: 1, duration: 220 });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expandedAreaId, fitView, nodes]);

  const handleNodeMouseEnter = useCallback<NodeMouseHandler<ExplorerFlowNode>>((_, node) => {
    if (node.data.kind === 'area') openArea(node.id, true);
    else clearCloseTimer();
  }, [clearCloseTimer, openArea]);

  const handleNodeMouseLeave = useCallback<NodeMouseHandler<ExplorerFlowNode>>(() => {
    scheduleClose();
  }, [scheduleClose]);

  return (
    <section className="explorer-shell" aria-label="業務エクスプローラー">
      <header className="explorer-title">
        <h1>業務エクスプローラー</h1>
      </header>
      <div className="explorer-canvas" data-expanded-area={expandedAreaId ?? ''}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.13, minZoom: 0.35, maxZoom: 1 }}
          minZoom={0.25}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          onPaneMouseEnter={scheduleClose}
          proOptions={{ hideAttribution: true }}
          aria-label="18業務領域のグラフ"
        >
          <Background gap={26} size={1} />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
    </section>
  );
}

export default function ExplorerApp() {
  return (
    <ReactFlowProvider>
      <ExplorerCanvas />
    </ReactFlowProvider>
  );
}
