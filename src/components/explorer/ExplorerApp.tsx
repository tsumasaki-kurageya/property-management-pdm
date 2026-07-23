import { useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { explorerNodesById } from '../../data/explorer';
import BusinessNavigator from './BusinessNavigator';
import ContextMap from './ContextMap';
import DetailPanel from './DetailPanel';
import FlowMap from './FlowMap';
import LifecycleNavigator from './LifecycleNavigator';
import {
  buildExplorerUrl,
  getDefaultExplorerState,
  parseExplorerUrl,
  type ExplorerRelationFilter,
  type ExplorerUiState,
  type ExplorerViewMode,
} from './explorerState';
import './ExplorerShell.css';
import './ExplorerStateControls.css';

const viewLabels: Record<ExplorerViewMode, string> = {
  flow: '仕事の流れ',
  hierarchy: '全体から見る',
  relations: '関係から探す',
};

const viewDescriptions: Record<ExplorerViewMode, string> = {
  flow: 'この前とこの後、条件による分岐を確認します。',
  hierarchy: '一つ上のまとまり、同じ階層、詳しい内容を確認します。',
  relations: '資料、成果物、担当者、法令などの登録済み関係を確認します。',
};

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('copy failed');
}

function ExplorerAppContent() {
  const initialState = getDefaultExplorerState();
  const [selectedId, setSelectedId] = useState(initialState.selectedId);
  const [viewMode, setViewMode] = useState<ExplorerViewMode>(initialState.viewMode);
  const [relationFilter, setRelationFilter] = useState<ExplorerRelationFilter>(initialState.relationFilter);
  const [urlNotice, setUrlNotice] = useState<string>();
  const [copyStatus, setCopyStatus] = useState('');
  const copyTimer = useRef<number>();
  const selectedNode = explorerNodesById.get(selectedId);

  const applyState = (state: ExplorerUiState) => {
    setSelectedId(state.selectedId);
    setViewMode(state.viewMode);
    setRelationFilter(state.relationFilter);
  };

  const writeHistory = (state: ExplorerUiState, mode: 'push' | 'replace') => {
    if (typeof window === 'undefined') return;
    const url = buildExplorerUrl(new URL(window.location.href), state);
    const method = mode === 'push' ? 'pushState' : 'replaceState';
    window.history[method]({ explorer: state }, '', url);
  };

  const navigate = (nextState: ExplorerUiState) => {
    applyState(nextState);
    setUrlNotice(undefined);
    writeHistory(nextState, 'push');
  };

  useEffect(() => {
    const applyLocation = () => {
      const parsed = parseExplorerUrl(new URL(window.location.href));
      applyState(parsed.state);
      setUrlNotice(parsed.notice);
      writeHistory(parsed.state, 'replace');
    };

    applyLocation();
    window.addEventListener('popstate', applyLocation);
    return () => window.removeEventListener('popstate', applyLocation);
  }, []);

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);

  const selectNode = (nodeId: string) => {
    if (!explorerNodesById.has(nodeId)) return;
    navigate({ selectedId: nodeId, viewMode, relationFilter });
  };

  const selectView = (nextView: ExplorerViewMode) => {
    navigate({ selectedId, viewMode: nextView, relationFilter });
  };

  const selectRelationFilter = (nextFilter: ExplorerRelationFilter) => {
    navigate({ selectedId, viewMode: 'relations', relationFilter: nextFilter });
  };

  const copyCurrentUrl = async () => {
    const url = buildExplorerUrl(
      new URL(window.location.href),
      { selectedId, viewMode, relationFilter },
    );

    try {
      await copyText(url.href);
      setCopyStatus('URLをコピーしました');
    } catch {
      setCopyStatus('コピーできませんでした');
    }

    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyStatus(''), 2800);
  };

  return (
    <section className="explorer-shell" aria-label="業務エクスプローラー">
      <header className="explorer-toolbar">
        <div>
          <p className="explorer-eyebrow">BUSINESS EXPLORER</p>
          <h1>業務エクスプローラー</h1>
          <p>業務の前後、全体の中の位置、手順・記録・役割との関係を同じ画面で確認します。</p>
        </div>
        <div className="explorer-toolbar-controls">
          <div className="explorer-view-tabs" role="tablist" aria-label="表示方法">
            {(Object.keys(viewLabels) as ExplorerViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={viewMode === mode}
                aria-controls="explorer-map-panel"
                className={viewMode === mode ? 'is-active' : ''}
                onClick={() => selectView(mode)}
              >
                {viewLabels[mode]}
              </button>
            ))}
          </div>
          <div className="explorer-share-row">
            <button className="explorer-copy-url" type="button" onClick={copyCurrentUrl}>
              URLをコピー
            </button>
            <span className="explorer-copy-status" role="status" aria-live="polite">{copyStatus}</span>
          </div>
        </div>
      </header>

      {urlNotice && <p className="explorer-url-notice" role="status">{urlNotice}</p>}

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
          {viewMode === 'hierarchy' && (
            <ContextMap mode="hierarchy" selectedId={selectedId} onSelect={selectNode} />
          )}
          {viewMode === 'relations' && (
            <ContextMap
              mode="relations"
              selectedId={selectedId}
              onSelect={selectNode}
              relationFilter={relationFilter}
              onRelationFilterChange={selectRelationFilter}
            />
          )}
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
