import { useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { explorerGraph, explorerNodesById } from '../../data/explorer';
import BusinessNavigator from './BusinessNavigator';
import ContextMap from './ContextMap';
import DetailPanel from './DetailPanel';
import FlowMap from './FlowMap';
import LifecycleNavigator from './LifecycleNavigator';
import './ExplorerShell.css';

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

function getInitialNodeId(): string {
  if (explorerNodesById.has(DEFAULT_NODE_ID)) return DEFAULT_NODE_ID;
  return explorerGraph.nodes.find((node) => node.type === 'business')?.id ?? '';
}

function ExplorerAppContent() {
  const [selectedId, setSelectedId] = useState(getInitialNodeId);
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const selectedNode = explorerNodesById.get(selectedId);

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

      <DetailPanel selectedId={selectedId} onSelect={selectNode} />
      <LifecycleNavigator selectedId={selectedId} onSelect={selectNode} />
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
