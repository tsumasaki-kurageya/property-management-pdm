import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useReactFlow,
  type Edge as ReactFlowEdge,
  type Node as ReactFlowNode,
} from '@xyflow/react';
import { explorerNodesById, getExplorerEdgesForNode } from '../../data/explorer';
import type { ExplorerEdge, ExplorerNode } from '../../data/explorer/schema';
import { useExplorerMediaPreferences } from './explorerMedia';
import './FlowMap.css';

interface FlowMapProps {
  selectedId: string;
  onSelect: (nodeId: string) => void;
}

type FlowRelation = 'previous' | 'selected' | 'next' | 'branch' | 'missing';
type FlowMapState = 'loading' | 'ready' | 'error';

interface LocalFlow {
  previous: ExplorerEdge[];
  next: ExplorerEdge[];
  branches: ExplorerEdge[];
  area?: ExplorerNode;
}

interface FlowNodeLabelProps {
  node?: ExplorerNode;
  relation: FlowRelation;
  eyebrow: string;
}

const NODE_WIDTH = 210;
const NODE_HEIGHT = 92;
const elk = new ELK();

function edgePriority(edge: ExplorerEdge): number {
  if (edge.metadata?.basis === 'process-map') return 0;
  if (edge.metadata?.basis === 'catalog-order') return 2;
  return 1;
}

function collectLocalFlow(selectedId: string): LocalFlow {
  const connected = getExplorerEdgesForNode(selectedId);
  const preceding = connected
    .filter((edge) => edge.type === 'precedes')
    .sort((left, right) => edgePriority(left) - edgePriority(right));

  const previous = preceding.filter((edge) => edge.to === selectedId).slice(0, 2);
  const next = preceding.filter((edge) => edge.from === selectedId).slice(0, 2);
  const branches = connected
    .filter((edge) => edge.type === 'branches_to' && edge.from === selectedId)
    .slice(0, 3);
  const areaEdge = connected.find((edge) => edge.type === 'contains' && edge.to === selectedId);
  const area = areaEdge ? explorerNodesById.get(areaEdge.from) : undefined;

  return { previous, next, branches, area };
}

function relationLabel(relation: FlowRelation): string {
  const labels: Record<FlowRelation, string> = {
    previous: 'この前の仕事',
    selected: '選択中の仕事',
    next: 'この後の仕事',
    branch: '条件で分かれる仕事',
    missing: '関係が未登録',
  };
  return labels[relation];
}

function FlowNodeLabel({ node, relation, eyebrow }: FlowNodeLabelProps) {
  return (
    <div className="flow-map-node-copy">
      <span className="flow-map-node-eyebrow">{eyebrow}</span>
      {node ? (
        <>
          <strong>{node.label}</strong>
          <small>{node.id}</small>
        </>
      ) : (
        <>
          <strong>未登録</strong>
          <small>正本に関係が追加されると表示されます</small>
        </>
      )}
      <span className="flow-map-node-relation">{relationLabel(relation)}</span>
    </div>
  );
}

function edgeText(edge: ExplorerEdge, fallback: string): string {
  const label = edge.label?.trim();
  return label && !['前後', '分岐'].includes(label) ? label : fallback;
}

function nodeFor(id: string): ExplorerNode | undefined {
  return explorerNodesById.get(id);
}

async function layoutLocalFlow(
  selectedId: string,
  localFlow: LocalFlow,
): Promise<{ nodes: ReactFlowNode[]; edges: ReactFlowEdge[] }> {
  const selected = nodeFor(selectedId);
  if (!selected) return { nodes: [], edges: [] };

  const nodeRecords = new Map<string, { node?: ExplorerNode; relation: FlowRelation; eyebrow: string }>();
  nodeRecords.set(selectedId, { node: selected, relation: 'selected', eyebrow: '現在地' });

  for (const edge of localFlow.previous) {
    const node = nodeFor(edge.from);
    if (node) nodeRecords.set(node.id, { node, relation: 'previous', eyebrow: 'この前' });
  }
  for (const edge of localFlow.next) {
    const node = nodeFor(edge.to);
    if (node) nodeRecords.set(node.id, { node, relation: 'next', eyebrow: '通常の流れ' });
  }
  for (const edge of localFlow.branches) {
    const node = nodeFor(edge.to);
    if (node) nodeRecords.set(node.id, { node, relation: 'branch', eyebrow: edgeText(edge, '条件分岐') });
  }

  if (localFlow.previous.length === 0) {
    nodeRecords.set('__missing_previous__', { relation: 'missing', eyebrow: 'この前' });
  }
  if (localFlow.next.length === 0) {
    nodeRecords.set('__missing_next__', { relation: 'missing', eyebrow: '通常の流れ' });
  }

  const graphEdges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    kind: 'normal' | 'branch' | 'missing';
  }> = [];

  for (const edge of localFlow.previous) {
    if (nodeRecords.has(edge.from)) {
      graphEdges.push({
        id: edge.id,
        source: edge.from,
        target: selectedId,
        label: edgeText(edge, '前から続く'),
        kind: 'normal',
      });
    }
  }
  for (const edge of localFlow.next) {
    if (nodeRecords.has(edge.to)) {
      graphEdges.push({
        id: edge.id,
        source: selectedId,
        target: edge.to,
        label: edgeText(edge, '通常の流れ'),
        kind: 'normal',
      });
    }
  }
  for (const edge of localFlow.branches) {
    if (nodeRecords.has(edge.to)) {
      graphEdges.push({
        id: edge.id,
        source: selectedId,
        target: edge.to,
        label: edgeText(edge, '条件分岐'),
        kind: 'branch',
      });
    }
  }
  if (localFlow.previous.length === 0) {
    graphEdges.push({
      id: '__missing_previous_edge__',
      source: '__missing_previous__',
      target: selectedId,
      label: '未登録',
      kind: 'missing',
    });
  }
  if (localFlow.next.length === 0) {
    graphEdges.push({
      id: '__missing_next_edge__',
      source: selectedId,
      target: '__missing_next__',
      label: '未登録',
      kind: 'missing',
    });
  }

  const layout = await elk.layout({
    id: 'business-flow',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '42',
      'elk.layered.spacing.nodeNodeBetweenLayers': '86',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    },
    children: [...nodeRecords.keys()].map((id) => ({ id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: graphEdges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  });

  const positions = new Map(
    (layout.children ?? []).map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]),
  );

  const nodes: ReactFlowNode[] = [...nodeRecords.entries()].map(([id, record]) => ({
    id,
    position: positions.get(id) ?? { x: 0, y: 0 },
    data: {
      label: (
        <FlowNodeLabel
          node={record.node}
          relation={record.relation}
          eyebrow={record.eyebrow}
        />
      ) as ReactNode,
    },
    className: `flow-map-node is-${record.relation}`,
    style: { width: NODE_WIDTH, minHeight: NODE_HEIGHT },
    draggable: record.relation !== 'missing',
    selectable: Boolean(record.node),
  }));

  const edges: ReactFlowEdge[] = graphEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    markerEnd: edge.kind === 'missing' ? undefined : { type: MarkerType.ArrowClosed },
    className: `flow-map-edge is-${edge.kind}`,
    style: edge.kind === 'branch' ? { strokeDasharray: '7 5' } : undefined,
  }));

  return { nodes, edges };
}

function NodeLinkList({
  title,
  edges,
  resolveId,
  emptyText,
  onSelect,
}: {
  title: string;
  edges: ExplorerEdge[];
  resolveId: (edge: ExplorerEdge) => string;
  emptyText: string;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <section>
      <h3>{title}</h3>
      {edges.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <ul>
          {edges.map((edge) => {
            const node = nodeFor(resolveId(edge));
            if (!node) return null;
            return (
              <li key={edge.id}>
                <button type="button" onClick={() => onSelect(node.id)}>
                  <strong>{node.label}</strong>
                  <span>{node.id}</span>
                  {edge.type === 'branches_to' && <small>{edgeText(edge, '条件分岐')}</small>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function FlowMap({ selectedId, onSelect }: FlowMapProps) {
  const localFlow = useMemo(() => collectLocalFlow(selectedId), [selectedId]);
  const [nodes, setNodes] = useState<ReactFlowNode[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);
  const [state, setState] = useState<FlowMapState>('loading');
  const { fitView } = useReactFlow();
  const { coarsePointer, reducedMotion } = useExplorerMediaPreferences();

  const centerMap = useCallback(() => {
    void fitView({ padding: 0.24, duration: reducedMotion ? 0 : 240, maxZoom: 1.1 });
  }, [fitView, reducedMotion]);

  useEffect(() => {
    let active = true;
    setState('loading');
    layoutLocalFlow(selectedId, localFlow)
      .then((layout) => {
        if (!active) return;
        setNodes(layout.nodes);
        setEdges(layout.edges);
        setState('ready');
        window.requestAnimationFrame(() => centerMap());
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [centerMap, localFlow, selectedId]);

  const selectedNode = nodeFor(selectedId);
  const nodeCount = Math.max(0, nodes.filter((node) => !node.id.startsWith('__missing_')).length - 1);

  return (
    <div className="flow-map-view">
      <div className="flow-map-context">
        <div>
          <span>局所表示</span>
          <strong>{localFlow.area ? `${localFlow.area.id} ${localFlow.area.label}` : '所属分野未登録'}</strong>
          <small>選択中の業務と1ホップ先のみ表示</small>
        </div>
        <div className="flow-map-actions">
          <span>{nodeCount}件の前後・分岐</span>
          <button type="button" onClick={centerMap}>中央へ戻す</button>
        </div>
      </div>

      <div className="flow-map-canvas" aria-label="選択業務の前後と条件分岐">
        {state === 'loading' && <div className="explorer-state">仕事の流れを配置しています…</div>}
        {state === 'error' && <div className="explorer-state is-error">仕事の流れを表示できませんでした。</div>}
        {state === 'ready' && !selectedNode && <div className="explorer-state">対象業務がありません。</div>}
        {state === 'ready' && selectedNode && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.24, maxZoom: 1.1 }}
            minZoom={0.38}
            maxZoom={1.55}
            nodesConnectable={false}
            nodesDraggable={!coarsePointer}
            elementsSelectable
            panOnDrag={!coarsePointer}
            zoomOnScroll={!coarsePointer}
            onNodeClick={(_event, node) => {
              if (!node.id.startsWith('__missing_')) onSelect(node.id);
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={22} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>

      <div className="flow-map-legend" aria-label="関係線の凡例">
        <span><i className="is-normal" />通常の前後</span>
        <span><i className="is-branch" />条件による分岐</span>
        <span><i className="is-missing" />関係が未登録</span>
      </div>

      <div className="flow-map-text-alternative" aria-label="仕事の流れをテキストで確認">
        <NodeLinkList
          title="この前の仕事"
          edges={localFlow.previous}
          resolveId={(edge) => edge.from}
          emptyText="前の仕事は登録されていません。"
          onSelect={onSelect}
        />
        <NodeLinkList
          title="この後の仕事"
          edges={localFlow.next}
          resolveId={(edge) => edge.to}
          emptyText="通常の後続業務は登録されていません。"
          onSelect={onSelect}
        />
        <NodeLinkList
          title="条件で分かれる仕事"
          edges={localFlow.branches}
          resolveId={(edge) => edge.to}
          emptyText="条件分岐は登録されていません。"
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
