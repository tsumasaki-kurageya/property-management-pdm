import { useEffect, useMemo, useState } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge as FlowEdge,
  type Node as FlowNode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { explorerGraph, explorerNodesById, getExplorerEdgesForNode } from '../../data/explorer';
import type { ExplorerEdge, ExplorerNode } from '../../data/explorer/schema';
import './ExplorerShell.css';

const DEFAULT_NODE_ID = 'BM-09-06';
const NODE_WIDTH = 196;
const NODE_HEIGHT = 76;
const elk = new ELK();

type ViewMode = 'flow' | 'hierarchy' | 'relations';
type LayoutState = 'loading' | 'ready' | 'error';

const viewLabels: Record<ViewMode, string> = {
  flow: '仕事の流れ',
  hierarchy: '全体から見る',
  relations: '関係から探す',
};

function getInitialNodeId(): string {
  if (explorerNodesById.has(DEFAULT_NODE_ID)) return DEFAULT_NODE_ID;
  return explorerGraph.nodes.find((node) => node.type === 'business')?.id ?? '';
}

function chooseMapEdges(selectedId: string, mode: ViewMode): ExplorerEdge[] {
  const selectedEdges = getExplorerEdgesForNode(selectedId);

  if (mode === 'hierarchy') {
    return selectedEdges
      .filter((edge) => edge.type === 'contains' || edge.type === 'participates_in')
      .slice(0, 8);
  }

  if (mode === 'relations') {
    return selectedEdges
      .filter((edge) => ['uses', 'produces', 'performed_by', 'approved_by', 'governed_by', 'related_to'].includes(edge.type))
      .slice(0, 10);
  }

  const processFlow = selectedEdges.filter(
    (edge) => edge.type === 'precedes' && edge.metadata?.basis === 'process-map',
  );
  const incoming = processFlow.filter((edge) => edge.to === selectedId).slice(0, 2);
  const outgoing = processFlow.filter((edge) => edge.from === selectedId).slice(0, 2);
  const branches = selectedEdges.filter((edge) => edge.type === 'branches_to').slice(0, 2);
  const area = selectedEdges.filter((edge) => edge.type === 'contains' && edge.to === selectedId).slice(0, 1);
  return [...area, ...incoming, ...outgoing, ...branches];
}

function flowLabel(edge: ExplorerEdge): string {
  const labels: Partial<Record<ExplorerEdge['type'], string>> = {
    contains: '属する',
    precedes: '前後',
    branches_to: '分岐',
    uses: '必要',
    produces: '作成',
    performed_by: '実施',
    approved_by: '確認・承認',
    governed_by: '基準',
    participates_in: '位置',
    related_to: '関連',
  };
  return edge.label || labels[edge.type] || edge.type;
}

async function layoutMap(selectedId: string, mode: ViewMode): Promise<{ nodes: FlowNode[]; edges: FlowEdge[] }> {
  const graphEdges = chooseMapEdges(selectedId, mode);
  const nodeIds = new Set<string>([selectedId]);
  for (const edge of graphEdges) {
    nodeIds.add(edge.from);
    nodeIds.add(edge.to);
  }

  const sourceNodes = [...nodeIds]
    .map((id) => explorerNodesById.get(id))
    .filter((node): node is ExplorerNode => Boolean(node));

  const layout = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': mode === 'hierarchy' ? 'DOWN' : 'RIGHT',
      'elk.spacing.nodeNode': '42',
      'elk.layered.spacing.nodeNodeBetweenLayers': '72',
    },
    children: sourceNodes.map((node) => ({ id: node.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: graphEdges.map((edge) => ({ id: edge.id, sources: [edge.from], targets: [edge.to] })),
  });

  const positions = new Map((layout.children ?? []).map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));
  const nodes: FlowNode[] = sourceNodes.map((node) => ({
    id: node.id,
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    data: { label: `${node.id} ${node.label}` },
    className: node.id === selectedId ? 'explorer-flow-node is-selected' : 'explorer-flow-node',
    style: { width: NODE_WIDTH, minHeight: NODE_HEIGHT },
  }));
  const edges: FlowEdge[] = graphEdges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    label: flowLabel(edge),
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: edge.type === 'branches_to',
  }));

  return { nodes, edges };
}

function ExplorerAppContent() {
  const [selectedId, setSelectedId] = useState(getInitialNodeId);
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const [layoutState, setLayoutState] = useState<LayoutState>('loading');
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>([]);

  const businessNodes = useMemo(
    () => explorerGraph.nodes.filter((node) => node.type === 'business'),
    [],
  );
  const filteredNodes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return businessNodes.slice(0, 24);
    return businessNodes
      .filter((node) => `${node.id} ${node.label}`.toLowerCase().includes(normalized))
      .slice(0, 40);
  }, [businessNodes, query]);
  const selectedNode = explorerNodesById.get(selectedId);
  const selectedEdges = useMemo(() => getExplorerEdgesForNode(selectedId), [selectedId]);
  const lifecycleIds = useMemo(
    () => new Set(selectedEdges.filter((edge) => edge.type === 'participates_in' && edge.to.startsWith('LC-')).map((edge) => edge.to)),
    [selectedEdges],
  );

  useEffect(() => {
    const applyUrl = () => {
      const requestedId = new URL(window.location.href).searchParams.get('node');
      if (requestedId && explorerNodesById.has(requestedId)) setSelectedId(requestedId);
    };
    applyUrl();
    window.addEventListener('popstate', applyUrl);
    return () => window.removeEventListener('popstate', applyUrl);
  }, []);

  useEffect(() => {
    if (!selectedId || !explorerNodesById.has(selectedId)) return;
    const url = new URL(window.location.href);
    url.searchParams.set('node', selectedId);
    window.history.replaceState({}, '', url);
  }, [selectedId]);

  useEffect(() => {
    let active = true;
    setLayoutState('loading');
    layoutMap(selectedId, viewMode)
      .then(({ nodes, edges }) => {
        if (!active) return;
        setFlowNodes(nodes);
        setFlowEdges(edges);
        setLayoutState('ready');
      })
      .catch(() => {
        if (active) setLayoutState('error');
      });
    return () => {
      active = false;
    };
  }, [selectedId, viewMode]);

  const selectNode = (nodeId: string) => {
    if (explorerNodesById.has(nodeId)) setSelectedId(nodeId);
  };

  return (
    <section className="explorer-shell" aria-label="業務エクスプローラー">
      <header className="explorer-toolbar">
        <div>
          <p className="explorer-eyebrow">BUSINESS EXPLORER</p>
          <h1>業務エクスプローラー</h1>
          <p>業務の前後、属する分野、手順・記録・役割との関係を同じ画面で確認します。</p>
        </div>
        <div className="explorer-view-tabs" role="tablist" aria-label="表示方法">
          {(Object.keys(viewLabels) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={viewMode === mode}
              className={viewMode === mode ? 'is-active' : ''}
              onClick={() => setViewMode(mode)}
            >
              {viewLabels[mode]}
            </button>
          ))}
        </div>
      </header>

      <aside className="explorer-pane explorer-list-pane" aria-labelledby="explorer-list-title">
        <div className="explorer-pane-heading">
          <h2 id="explorer-list-title">業務を選ぶ</h2>
          <span>{businessNodes.length}業務</span>
        </div>
        <label className="explorer-search">
          <span>業務ID・業務名で検索</span>
          <input
            type="search"
            value={query}
            placeholder="例: BM-09-06、点検異常"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </label>
        <div className="explorer-business-list" role="listbox" aria-label="業務一覧">
          {filteredNodes.length === 0 ? (
            <p className="explorer-empty">該当する業務がありません。</p>
          ) : (
            filteredNodes.map((node) => (
              <button
                type="button"
                key={node.id}
                role="option"
                aria-selected={node.id === selectedId}
                className={node.id === selectedId ? 'is-selected' : ''}
                onClick={() => selectNode(node.id)}
              >
                <span>{node.id}</span>
                <strong>{node.label}</strong>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="explorer-pane explorer-map-pane" aria-labelledby="explorer-map-title">
        <div className="explorer-pane-heading">
          <h2 id="explorer-map-title">{viewLabels[viewMode]}</h2>
          <span>{selectedNode?.id ?? '未選択'}</span>
        </div>
        <div className="explorer-map" aria-live="polite">
          {layoutState === 'loading' && <div className="explorer-state">関係を配置しています…</div>}
          {layoutState === 'error' && <div className="explorer-state is-error">表示データの準備に失敗しました。</div>}
          {layoutState === 'ready' && !selectedNode && <div className="explorer-state">対象業務がありません。</div>}
          {layoutState === 'ready' && selectedNode && (
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              fitViewOptions={{ padding: 0.24 }}
              minZoom={0.4}
              maxZoom={1.6}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              onNodeClick={(_event, node) => selectNode(node.id)}
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={20} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}
        </div>
      </main>

      <aside className="explorer-pane explorer-detail-pane" aria-labelledby="explorer-detail-title">
        <div className="explorer-pane-heading">
          <h2 id="explorer-detail-title">選択中の業務</h2>
          <span>{selectedEdges.length}関係</span>
        </div>
        {selectedNode ? (
          <div className="explorer-detail-content">
            <p className="explorer-node-type">{selectedNode.type}</p>
            <h3>{selectedNode.id} {selectedNode.label}</h3>
            <p>{selectedNode.description || 'この項目の説明は、参照元の分析資料から確認できます。'}</p>
            <dl>
              <div><dt>この前・この後</dt><dd>{selectedEdges.filter((edge) => edge.type === 'precedes').length}</dd></div>
              <div><dt>必要なもの</dt><dd>{selectedEdges.filter((edge) => edge.type === 'uses').length}</dd></div>
              <div><dt>作られるもの</dt><dd>{selectedEdges.filter((edge) => edge.type === 'produces').length}</dd></div>
              <div><dt>手順・主要関連</dt><dd>{selectedEdges.filter((edge) => edge.type === 'related_to' || edge.type === 'contains').length}</dd></div>
            </dl>
            {selectedNode.href && <a className="explorer-reference-link" href={selectedNode.href}>リファレンスで詳しく見る</a>}
            <p className="explorer-source">参照元: <code>{selectedNode.source.path}</code></p>
          </div>
        ) : (
          <p className="explorer-empty">対象業務がありません。</p>
        )}
      </aside>

      <footer className="explorer-lifecycle" aria-labelledby="explorer-lifecycle-title">
        <div>
          <p className="explorer-eyebrow">LIFECYCLE</p>
          <h2 id="explorer-lifecycle-title">契約から改善までの現在位置</h2>
        </div>
        <ol>
          {explorerGraph.lifecycleStages.map((stage) => (
            <li key={stage.id} className={lifecycleIds.has(stage.id) ? 'is-current' : ''}>
              <span>{stage.id}</span>
              <strong>{stage.label}</strong>
            </li>
          ))}
        </ol>
      </footer>
    </section>
  );
}

export default function ExplorerApp() {
  return (
    <ReactFlowProvider>
      <ExplorerAppContent />
    </ReactFlowProvider>
  );
}
