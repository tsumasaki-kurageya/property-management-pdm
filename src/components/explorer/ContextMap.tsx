import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { explorerGraph, explorerNodesById, getExplorerEdgesForNode } from '../../data/explorer';
import type { ExplorerEdge, ExplorerEdgeType, ExplorerNode, ExplorerNodeType } from '../../data/explorer/schema';
import type { ExplorerRelationFilter } from './explorerState';
import { useExplorerMediaPreferences } from './explorerMedia';
import './ContextMap.css';

export type ContextMapMode = 'hierarchy' | 'relations';

type ContextMapState = 'loading' | 'ready' | 'error';
type HierarchyRole = 'parent' | 'selected' | 'sibling' | 'child';

interface ContextMapProps {
  mode: ContextMapMode;
  selectedId: string;
  onSelect: (nodeId: string) => void;
  relationFilter?: ExplorerRelationFilter;
  onRelationFilterChange?: (filter: ExplorerRelationFilter) => void;
}

interface DisplayNode {
  node: ExplorerNode;
  role: HierarchyRole | 'related';
  relationLabel: string;
}

interface DisplayEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  className: string;
}

interface ContextData {
  nodes: DisplayNode[];
  edges: DisplayEdge[];
  omitted: number;
  informationState: 'available' | 'unregistered' | 'not-applicable' | 'filtered-empty';
  textItems: Array<{ id: string; label: string; relation: string; type: ExplorerNodeType }>;
}

const elk = new ELK();
const NODE_WIDTH = 196;
const NODE_HEIGHT = 88;
const containsEdges = explorerGraph.edges.filter((edge) => edge.type === 'contains');
const relationEdgeTypes = new Set<ExplorerEdgeType>([
  'uses',
  'produces',
  'performed_by',
  'approved_by',
  'governed_by',
  'related_to',
]);

const nodeTypeLabels: Record<ExplorerNodeType, string> = {
  area: '業務領域',
  business: '業務',
  procedure: '詳しい手順',
  artifact: '記録・帳票',
  role: '担当者・関係者',
  standard: '法令・基準',
  lifecycle: 'ライフサイクル',
  process: '横断プロセス',
};

const relationFilterOptions: Array<{
  id: ExplorerRelationFilter;
  label: string;
  edgeTypes: ExplorerEdgeType[];
}> = [
  { id: 'all', label: 'すべて', edgeTypes: [] },
  { id: 'related_to', label: '関係する仕事・手順', edgeTypes: ['related_to'] },
  { id: 'uses', label: '必要なもの', edgeTypes: ['uses'] },
  { id: 'produces', label: '作られるもの', edgeTypes: ['produces'] },
  { id: 'people', label: '担当・確認する人', edgeTypes: ['performed_by', 'approved_by'] },
  { id: 'governed_by', label: '法令・基準', edgeTypes: ['governed_by'] },
];

function getOtherNodeId(edge: ExplorerEdge, selectedId: string): string {
  return edge.from === selectedId ? edge.to : edge.from;
}

function relationLabel(edge: ExplorerEdge, selectedId: string): string {
  const outgoing = edge.from === selectedId;
  const labels: Record<ExplorerEdgeType, [string, string]> = {
    contains: ['含む', '属する'],
    precedes: ['この後', 'この前'],
    branches_to: ['条件分岐', '分岐元'],
    uses: ['必要なもの', 'この情報を使う仕事'],
    produces: ['作られるもの', 'この成果物を作る仕事'],
    performed_by: ['実施する人', '担当する仕事'],
    approved_by: ['確認・承認する人', '確認・承認する仕事'],
    governed_by: ['関係する法令・基準', 'この基準が関わる仕事'],
    participates_in: ['位置づけ', '含まれる業務'],
    related_to: ['主な関連', '主な関連'],
  };
  return edge.label || labels[edge.type][outgoing ? 0 : 1];
}

function matchesFilter(edge: ExplorerEdge, filter: ExplorerRelationFilter): boolean {
  if (filter === 'all') return true;
  return relationFilterOptions.find((option) => option.id === filter)?.edgeTypes.includes(edge.type) ?? false;
}

function takeWindow<T>(items: T[], selectedIndex: number, limit: number): T[] {
  if (items.length <= limit) return items;
  const half = Math.floor(limit / 2);
  const start = Math.max(0, Math.min(selectedIndex - half, items.length - limit));
  return items.slice(start, start + limit);
}

function buildHierarchyContext(selectedId: string, expanded: boolean): ContextData {
  const selectedNode = explorerNodesById.get(selectedId);
  if (!selectedNode) {
    return { nodes: [], edges: [], omitted: 0, informationState: 'unregistered', textItems: [] };
  }

  const parentCandidates = containsEdges.filter((edge) => edge.to === selectedId);
  const parentEdge = parentCandidates.find((edge) => {
    const parent = explorerNodesById.get(edge.from);
    return parent?.type === 'area' || parent?.type === 'business';
  }) ?? parentCandidates[0];
  const directChildren = containsEdges
    .filter((edge) => edge.from === selectedId)
    .sort((left, right) => left.to.localeCompare(right.to));

  const siblingLimit = expanded ? 14 : 7;
  const childLimit = expanded ? 16 : 8;
  let siblingEdges: ExplorerEdge[] = [];
  let siblingTotal = 0;

  if (parentEdge) {
    const childrenOfParent = containsEdges
      .filter((edge) => edge.from === parentEdge.from)
      .filter((edge) => explorerNodesById.get(edge.to)?.type === selectedNode.type)
      .sort((left, right) => left.to.localeCompare(right.to));
    siblingTotal = Math.max(0, childrenOfParent.length - 1);
    const selectedIndex = Math.max(0, childrenOfParent.findIndex((edge) => edge.to === selectedId));
    siblingEdges = takeWindow(childrenOfParent, selectedIndex, siblingLimit + 1)
      .filter((edge) => edge.to !== selectedId)
      .slice(0, siblingLimit);
  }

  const childEdges = directChildren.slice(0, childLimit);
  const nodesById = new Map<string, DisplayNode>();
  nodesById.set(selectedId, { node: selectedNode, role: 'selected', relationLabel: '選択中' });

  if (parentEdge) {
    const parent = explorerNodesById.get(parentEdge.from);
    if (parent) nodesById.set(parent.id, { node: parent, role: 'parent', relationLabel: '一つ上のまとまり' });
  }
  for (const edge of siblingEdges) {
    const node = explorerNodesById.get(edge.to);
    if (node) nodesById.set(node.id, { node, role: 'sibling', relationLabel: '同じ階層' });
  }
  for (const edge of childEdges) {
    const node = explorerNodesById.get(edge.to);
    if (node) {
      nodesById.set(node.id, {
        node,
        role: 'child',
        relationLabel: selectedNode.type === 'area' ? 'この領域の仕事' : '詳しい内容',
      });
    }
  }

  const displayEdges: DisplayEdge[] = [];
  if (parentEdge && nodesById.has(parentEdge.from)) {
    displayEdges.push({
      id: parentEdge.id,
      source: parentEdge.from,
      target: selectedId,
      label: '含む',
      className: 'context-edge is-parent',
    });
  }
  for (const edge of siblingEdges) {
    if (!parentEdge || !nodesById.has(edge.to)) continue;
    displayEdges.push({
      id: edge.id,
      source: parentEdge.from,
      target: edge.to,
      label: '同じまとまり',
      className: 'context-edge is-sibling',
    });
  }
  for (const edge of childEdges) {
    if (!nodesById.has(edge.to)) continue;
    displayEdges.push({
      id: edge.id,
      source: selectedId,
      target: edge.to,
      label: selectedNode.type === 'area' ? '含まれる仕事' : '詳しい内容',
      className: 'context-edge is-child',
    });
  }

  const hierarchyApplicable = ['area', 'business', 'procedure'].includes(selectedNode.type);
  const hasHierarchy = Boolean(parentEdge) || directChildren.length > 0;
  const informationState = hasHierarchy ? 'available' : hierarchyApplicable ? 'unregistered' : 'not-applicable';
  const omitted = Math.max(0, siblingTotal - siblingEdges.length)
    + Math.max(0, directChildren.length - childEdges.length);
  const textItems = [...nodesById.values()]
    .filter((item) => item.node.id !== selectedId)
    .map((item) => ({
      id: item.node.id,
      label: item.node.label,
      relation: item.relationLabel,
      type: item.node.type,
    }));

  return { nodes: [...nodesById.values()], edges: displayEdges, omitted, informationState, textItems };
}

function buildRelationContext(
  selectedId: string,
  filter: ExplorerRelationFilter,
  expanded: boolean,
): ContextData {
  const selectedNode = explorerNodesById.get(selectedId);
  if (!selectedNode) {
    return { nodes: [], edges: [], omitted: 0, informationState: 'unregistered', textItems: [] };
  }

  const allRelations = getExplorerEdgesForNode(selectedId)
    .filter((edge) => relationEdgeTypes.has(edge.type))
    .sort((left, right) => {
      const priorities: ExplorerEdgeType[] = [
        'related_to',
        'uses',
        'produces',
        'performed_by',
        'approved_by',
        'governed_by',
      ];
      return priorities.indexOf(left.type) - priorities.indexOf(right.type)
        || left.id.localeCompare(right.id);
    });
  const filtered = allRelations.filter((edge) => matchesFilter(edge, filter));
  const limit = expanded ? 24 : 12;
  const visible = filtered.slice(0, limit);
  const nodesById = new Map<string, DisplayNode>();
  nodesById.set(selectedId, { node: selectedNode, role: 'selected', relationLabel: '選択中' });
  const displayEdges: DisplayEdge[] = [];
  const textItems: ContextData['textItems'] = [];

  for (const edge of visible) {
    const otherId = getOtherNodeId(edge, selectedId);
    const node = explorerNodesById.get(otherId);
    if (!node) continue;
    const label = relationLabel(edge, selectedId);
    nodesById.set(node.id, { node, role: 'related', relationLabel: label });
    displayEdges.push({
      id: `display-${edge.id}`,
      source: selectedId,
      target: otherId,
      label,
      className: `context-edge relation-${edge.type}`,
    });
    textItems.push({ id: node.id, label: node.label, relation: label, type: node.type });
  }

  const informationState = allRelations.length === 0
    ? 'unregistered'
    : filtered.length === 0
      ? 'filtered-empty'
      : 'available';

  return {
    nodes: [...nodesById.values()],
    edges: displayEdges,
    omitted: Math.max(0, filtered.length - visible.length),
    informationState,
    textItems,
  };
}

function NodeLabel({ item }: { item: DisplayNode }): ReactNode {
  return (
    <div className="context-node-copy">
      <span className="context-node-relation">{item.relationLabel}</span>
      <strong>{item.node.label}</strong>
      <small>{item.node.id}</small>
      <span className="context-node-type">{nodeTypeLabels[item.node.type]}</span>
    </div>
  );
}

async function layoutContext(
  data: ContextData,
  mode: ContextMapMode,
): Promise<{ nodes: ReactFlowNode[]; edges: ReactFlowEdge[] }> {
  const layout = await elk.layout({
    id: 'context-root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': mode === 'hierarchy' ? 'DOWN' : 'RIGHT',
      'elk.spacing.nodeNode': mode === 'hierarchy' ? '34' : '26',
      'elk.layered.spacing.nodeNodeBetweenLayers': mode === 'hierarchy' ? '70' : '92',
      'elk.padding': '[top=30,left=30,bottom=30,right=30]',
    },
    children: data.nodes.map((item) => ({ id: item.node.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: data.edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  });
  const positions = new Map(
    (layout.children ?? []).map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]),
  );
  const nodes: ReactFlowNode[] = data.nodes.map((item) => ({
    id: item.node.id,
    position: positions.get(item.node.id) ?? { x: 0, y: 0 },
    data: { label: <NodeLabel item={item} /> },
    className: `context-node role-${item.role} type-${item.node.type}${item.role === 'selected' ? ' is-selected' : ''}`,
    style: { width: NODE_WIDTH, minHeight: NODE_HEIGHT },
  }));
  const edges: ReactFlowEdge[] = data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    className: edge.className,
    markerEnd: { type: MarkerType.ArrowClosed },
  }));
  return { nodes, edges };
}

function stateMessage(mode: ContextMapMode, state: ContextData['informationState']): string {
  if (state === 'not-applicable') return 'この種類の項目には、上位・下位という階層を表示しません。';
  if (state === 'filtered-empty') return 'この分類に該当する登録済みの関係はありません。';
  return mode === 'hierarchy'
    ? '上位・同階層・下位の情報がまだ登録されていません。'
    : '関係がないとは断定できません。表示できる関係情報がまだ登録されていません。';
}

export default function ContextMap({
  mode,
  selectedId,
  onSelect,
  relationFilter,
  onRelationFilterChange,
}: ContextMapProps) {
  const [localFilter, setLocalFilter] = useState<ExplorerRelationFilter>('all');
  const [expanded, setExpanded] = useState(false);
  const [mapState, setMapState] = useState<ContextMapState>('loading');
  const [nodes, setNodes] = useState<ReactFlowNode[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);
  const { fitView } = useReactFlow();
  const { coarsePointer, reducedMotion } = useExplorerMediaPreferences();
  const selectedNode = explorerNodesById.get(selectedId);
  const filter = relationFilter ?? localFilter;
  const allRelationEdges = useMemo(
    () => getExplorerEdgesForNode(selectedId).filter((edge) => relationEdgeTypes.has(edge.type)),
    [selectedId],
  );
  const data = useMemo(
    () => mode === 'hierarchy'
      ? buildHierarchyContext(selectedId, expanded)
      : buildRelationContext(selectedId, filter, expanded),
    [expanded, filter, mode, selectedId],
  );

  useEffect(() => {
    setExpanded(false);
    if (mode === 'hierarchy' && relationFilter === undefined) setLocalFilter('all');
  }, [mode, relationFilter, selectedId]);

  useEffect(() => {
    let active = true;
    if (data.informationState !== 'available') {
      setNodes([]);
      setEdges([]);
      setMapState('ready');
      return undefined;
    }
    setMapState('loading');
    layoutContext(data, mode)
      .then((layout) => {
        if (!active) return;
        setNodes(layout.nodes);
        setEdges(layout.edges);
        setMapState('ready');
        requestAnimationFrame(() => fitView({ padding: 0.2, duration: reducedMotion ? 0 : 180 }));
      })
      .catch(() => {
        if (active) setMapState('error');
      });
    return () => {
      active = false;
    };
  }, [data, fitView, mode, reducedMotion]);

  const updateFilter = (nextFilter: ExplorerRelationFilter) => {
    if (relationFilter === undefined) setLocalFilter(nextFilter);
    onRelationFilterChange?.(nextFilter);
  };

  const filterCounts = useMemo(() => Object.fromEntries(
    relationFilterOptions.map((option) => [
      option.id,
      option.id === 'all'
        ? allRelationEdges.length
        : allRelationEdges.filter((edge) => matchesFilter(edge, option.id)).length,
    ]),
  ) as Record<ExplorerRelationFilter, number>, [allRelationEdges]);

  const title = mode === 'hierarchy' ? '全体の中の位置を見る' : '関係する情報から探す';
  const description = mode === 'hierarchy'
    ? '一つ上のまとまり、同じ階層、詳しい内容を上下の配置で確認します。'
    : '選択中の項目と、仕事・資料・成果物・担当者・法令の登録済み関係を確認します。';

  return (
    <section className={`context-map-view mode-${mode}`} aria-label={title}>
      <header className="context-map-context">
        <div>
          <span>{mode === 'hierarchy' ? 'DETAIL LEVEL' : 'RELATED INFORMATION'}</span>
          <strong>{title}</strong>
          <small>{description}</small>
        </div>
        <div className="context-map-actions">
          <span>{data.nodes.length}項目</span>
          <button type="button" onClick={() => fitView({ padding: 0.2, duration: reducedMotion ? 0 : 180 })}>中央へ戻す</button>
        </div>
      </header>

      {mode === 'relations' && (
        <div className="context-map-filters" aria-label="関係の種類">
          {relationFilterOptions.map((option) => (
            <button
              type="button"
              key={option.id}
              aria-pressed={filter === option.id}
              className={filter === option.id ? 'is-active' : ''}
              onClick={() => updateFilter(option.id)}
            >
              <span>{option.label}</span>
              <small>{filterCounts[option.id]}</small>
            </button>
          ))}
        </div>
      )}

      <div className="context-map-canvas">
        {mapState === 'loading' && <div className="context-map-state">関係を配置しています…</div>}
        {mapState === 'error' && <div className="context-map-state is-error">表示データの準備に失敗しました。</div>}
        {mapState === 'ready' && data.informationState !== 'available' && (
          <div className="context-map-state">
            <strong>{data.informationState === 'filtered-empty' ? '該当する登録済み関係はありません' : '情報未登録'}</strong>
            <span>{stateMessage(mode, data.informationState)}</span>
          </div>
        )}
        {mapState === 'ready' && data.informationState === 'available' && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.38}
            maxZoom={1.65}
            nodesDraggable={false}
            panOnDrag={!coarsePointer}
            zoomOnScroll={!coarsePointer}
            nodesConnectable={false}
            elementsSelectable
            onNodeClick={(_event, node) => onSelect(node.id)}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>

      {data.informationState === 'available' && (
        <div className="context-map-list" aria-label="表示中の関係を文字で確認">
          <div className="context-map-list-heading">
            <strong>{selectedNode?.label ?? selectedId}</strong>
            <span>表示中の関係</span>
          </div>
          <ul>
            {data.textItems.map((item) => (
              <li key={`${item.relation}-${item.id}`}>
                <button type="button" onClick={() => onSelect(item.id)}>
                  <span>{item.relation}</span>
                  <strong>{item.label}</strong>
                  <small>{nodeTypeLabels[item.type]} · {item.id}</small>
                </button>
              </li>
            ))}
          </ul>
          {data.omitted > 0 && (
            <button className="context-map-more" type="button" onClick={() => setExpanded((value) => !value)}>
              {expanded ? '表示を絞る' : `さらに表示（残り${data.omitted}件）`}
            </button>
          )}
        </div>
      )}

      <div className="context-map-legend" aria-label="表示の凡例">
        {mode === 'hierarchy' ? (
          <>
            <span><i className="legend-parent" />一つ上</span>
            <span><i className="legend-selected" />選択中</span>
            <span><i className="legend-sibling" />同じ階層</span>
            <span><i className="legend-child" />詳しい内容</span>
          </>
        ) : (
          <>
            <span><i className="legend-business" />仕事・手順</span>
            <span><i className="legend-artifact" />記録・帳票</span>
            <span><i className="legend-role" />担当者</span>
            <span><i className="legend-standard" />法令・基準</span>
          </>
        )}
      </div>
    </section>
  );
}
