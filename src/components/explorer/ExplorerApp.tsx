import { useEffect, useMemo, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { explorerGraph, explorerNodesById, getExplorerEdgesForNode } from '../../data/explorer';
import BusinessNavigator from './BusinessNavigator';
import ContextMap from './ContextMap';
import FlowMap from './FlowMap';
import './ExplorerShell.css';

const BASE_URL = import.meta.env.BASE_URL;
const DEFAULT_NODE_ID = 'BM-09-06';

type ViewMode = 'flow' | 'hierarchy' | 'relations';

const viewLabels: Record<ViewMode, string> = {
  flow: '仕事の流れ',
  hierarchy: '全体から見る',
  relations: '関係から探す',
};

const viewDescriptions: Record<ViewMode, string> = {
  flow: 'この前とこの後、条件による分岐を確認します。',
  hierarchy: '一つ上のまとまり、同じ階層、詳しい内容を確認します。',
  relations: '資料、成果物、担当者、法令などの登録済み関係を確認します。',
};

const nodeTypeLabels = {
  area: '業務領域',
  business: '業務',
  procedure: '詳しい手順',
  artifact: '記録・帳票',
  role: '担当者・関係者',
  standard: '法令・基準',
  lifecycle: 'ライフサイクル',
  process: '横断プロセス',
} as const;

function getInitialNodeId(): string {
  if (explorerNodesById.has(DEFAULT_NODE_ID)) return DEFAULT_NODE_ID;
  return explorerGraph.nodes.find((node) => node.type === 'business')?.id ?? '';
}

function ExplorerAppContent() {
  const [selectedId, setSelectedId] = useState(getInitialNodeId);
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const selectedNode = explorerNodesById.get(selectedId);
  const selectedEdges = useMemo(() => getExplorerEdgesForNode(selectedId), [selectedId]);
  const lifecycleIds = useMemo(
    () => new Set(selectedEdges
      .filter((edge) => edge.type === 'participates_in' && edge.to.startsWith('LC-'))
      .map((edge) => edge.to)),
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

  const selectNode = (nodeId: string) => {
    if (explorerNodesById.has(nodeId)) setSelectedId(nodeId);
  };

  return (
    <section className="explorer-shell" aria-label="業務エクスプローラー">
      <header className="explorer-toolbar">
        <div>
          <p className="explorer-eyebrow">BUSINESS EXPLORER</p>
          <h1>業務エクスプローラー</h1>
          <p>業務の前後、全体の中の位置、手順・記録・役割との関係を同じ画面で確認します。</p>
        </div>
        <div className="explorer-view-tabs" role="tablist" aria-label="表示方法">
          {(Object.keys(viewLabels) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={viewMode === mode}
              aria-controls="explorer-map-panel"
              className={viewMode === mode ? 'is-active' : ''}
              onClick={() => setViewMode(mode)}
            >
              {viewLabels[mode]}
            </button>
          ))}
        </div>
      </header>

      <BusinessNavigator selectedId={selectedId} onSelect={selectNode} />

      <main className="explorer-pane explorer-map-pane" aria-labelledby="explorer-map-title">
        <div className="explorer-pane-heading">
          <div>
            <h2 id="explorer-map-title">{viewLabels[viewMode]}</h2>
            <small>{viewDescriptions[viewMode]}</small>
          </div>
          <span>{selectedNode?.id ?? '未選択'}</span>
        </div>
        <div id="explorer-map-panel" className="explorer-map" role="tabpanel" aria-live="polite">
          {viewMode === 'flow' && <FlowMap selectedId={selectedId} onSelect={selectNode} />}
          {viewMode === 'hierarchy' && <ContextMap mode="hierarchy" selectedId={selectedId} onSelect={selectNode} />}
          {viewMode === 'relations' && <ContextMap mode="relations" selectedId={selectedId} onSelect={selectNode} />}
        </div>
      </main>

      <aside className="explorer-pane explorer-detail-pane" aria-labelledby="explorer-detail-title">
        <div className="explorer-pane-heading">
          <h2 id="explorer-detail-title">選択中の項目</h2>
          <span>{selectedEdges.length}関係</span>
        </div>
        {selectedNode ? (
          <div className="explorer-detail-content">
            <p className="explorer-node-type">{nodeTypeLabels[selectedNode.type]}</p>
            <h3>{selectedNode.id} {selectedNode.label}</h3>
            <p>{selectedNode.description || 'この項目の説明は、参照元の分析資料から確認できます。'}</p>
            <dl>
              <div><dt>この前・この後</dt><dd>{selectedEdges.filter((edge) => edge.type === 'precedes').length}</dd></div>
              <div><dt>必要なもの</dt><dd>{selectedEdges.filter((edge) => edge.type === 'uses').length}</dd></div>
              <div><dt>作られるもの</dt><dd>{selectedEdges.filter((edge) => edge.type === 'produces').length}</dd></div>
              <div><dt>手順・主要関連</dt><dd>{selectedEdges.filter((edge) => edge.type === 'related_to' || edge.type === 'contains').length}</dd></div>
            </dl>
            {selectedNode.href && (
              <a className="explorer-reference-link" href={`${BASE_URL}${selectedNode.href.replace(/^\//, '')}`}>
                リファレンスで詳しく見る
              </a>
            )}
            <p className="explorer-source">参照元: <code>{selectedNode.source.path}</code></p>
          </div>
        ) : (
          <p className="explorer-empty">対象項目がありません。</p>
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
