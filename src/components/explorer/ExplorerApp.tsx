import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
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

type LifecycleGroup = 'main' | 'execution' | 'cross';

interface ExplorerNodeData extends Record<string, unknown> {
  kind: ExplorerNodeKind;
  id: string;
  label: string;
  lifecycleGroup?: LifecycleGroup;
  dimmed?: boolean;
  expanded?: boolean;
  onFocus?: (id: string) => void;
  onToggle?: (id: string) => void;
}

type ExplorerFlowNode = Node<ExplorerNodeData, ExplorerNodeKind>;

const AREA_X_GAP = 420;
const AREA_ORIGIN_X = 170;
const OPEN_DELAY = 150;
const CLOSE_DELAY = 250;

const lifecycleRows = {
  main: ['BM-01', 'BM-02', 'BM-03', 'BM-04', 'BM-05', 'BM-13', 'BM-16', 'BM-18'],
  execution: ['BM-06', 'BM-07', 'BM-08', 'BM-09', 'BM-10', 'BM-11'],
  cross: ['BM-12', 'BM-14', 'BM-15', 'BM-17'],
} as const satisfies Record<LifecycleGroup, readonly string[]>;

const areaLayout = new Map<string, { group: LifecycleGroup; x: number; y: number }>();

Object.entries(lifecycleRows).forEach(([group, areaIds]) => {
  const lifecycleGroup = group as LifecycleGroup;
  const rowWidth = (areaIds.length - 1) * AREA_X_GAP;
  const mainRowWidth = (lifecycleRows.main.length - 1) * AREA_X_GAP;
  const rowOriginX = AREA_ORIGIN_X + (mainRowWidth - rowWidth) / 2;
  const y = lifecycleGroup === 'main' ? 170 : lifecycleGroup === 'execution' ? 560 : 950;

  areaIds.forEach((areaId, index) => {
    areaLayout.set(areaId, {
      group: lifecycleGroup,
      x: rowOriginX + index * AREA_X_GAP,
      y,
    });
  });
});

const businessAreas = [...explorerGraph.businessAreas].sort((left, right) => left.order - right.order);

function areaPosition(areaId: string) {
  const layout = areaLayout.get(areaId);
  if (!layout) throw new Error(`業務領域 ${areaId} のライフサイクル配置が未定義です。`);
  return { x: layout.x, y: layout.y };
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
      className={`explorer-area-node explorer-area-node--${data.lifecycleGroup}${data.expanded ? ' is-expanded' : ''}${data.dimmed ? ' is-dimmed' : ''}`}
      data-lifecycle-group={data.lifecycleGroup}
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
    const areaNodes = businessAreas.map((area): ExplorerFlowNode => ({
      id: area.id,
      type: 'area',
      position: areaPosition(area.id),
      draggable: false,
      selectable: false,
      data: {
        kind: 'area',
        id: area.id,
        label: area.label,
        lifecycleGroup: areaLayout.get(area.id)?.group,
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
        <p className="explorer-lifecycle-legend" aria-label="業務領域の配置区分">
          <span data-group="main">主系列（左から右）</span>
          <span data-group="execution">現場実行</span>
          <span data-group="cross">横断基盤</span>
        </p>
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
