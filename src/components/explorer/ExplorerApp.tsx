import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { explorerNodesById } from '../../data/explorer';
import BusinessAreaMap from './BusinessAreaMap';
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
import './ExplorerQuality.css';

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

type MobilePanel = 'map' | 'detail' | 'lifecycle';

const mobilePanelLabels: Record<MobilePanel, string> = {
  map: '図を見る',
  detail: '説明を見る',
  lifecycle: '全体の位置',
};

const mobilePanelTargets: Record<MobilePanel, string> = {
  map: 'explorer-map-panel',
  detail: 'explorer-detail-mobile-panel',
  lifecycle: 'explorer-lifecycle-mobile-panel',
};

function rovingTarget<T extends string>(
  event: ReactKeyboardEvent<HTMLButtonElement>,
  values: readonly T[],
  current: T,
): T | undefined {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return undefined;
  const currentIndex = values.indexOf(current);
  if (currentIndex < 0) return undefined;
  if (event.key === 'Home') return values[0];
  if (event.key === 'End') return values[values.length - 1];
  const movement = event.key === 'ArrowRight' ? 1 : -1;
  return values[(currentIndex + movement + values.length) % values.length];
}

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
  const [isOverview, setIsOverview] = useState(true);
  const [viewMode, setViewMode] = useState<ExplorerViewMode>(initialState.viewMode);
  const [relationFilter, setRelationFilter] = useState<ExplorerRelationFilter>(initialState.relationFilter);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('map');
  const [urlNotice, setUrlNotice] = useState<string>();
  const [copyStatus, setCopyStatus] = useState('');
  const copyTimer = useRef<number | undefined>(undefined);
  const selectedNode = explorerNodesById.get(selectedId);

  const applyState = (state: ExplorerUiState) => {
    setSelectedId(state.selectedId);
    setViewMode(state.viewMode);
    setRelationFilter(state.relationFilter);
  };

  const writeHistory = (state: ExplorerUiState, mode: 'push' | 'replace') => {
    if (typeof window === 'undefined') return;
    const url = buildExplorerUrl(new URL(window.location.href), state);
    if (mode === 'push') {
      window.history.pushState({ explorer: state }, '', url.href);
    } else {
      window.history.replaceState({ explorer: state }, '', url.href);
    }
  };

  const navigate = (nextState: ExplorerUiState) => {
    applyState(nextState);
    setUrlNotice(undefined);
    writeHistory(nextState, 'push');
  };

  useEffect(() => {
    const applyLocation = () => {
      const url = new URL(window.location.href);
      const parsed = parseExplorerUrl(url);
      const isOverviewLocation = !['business', 'item', 'node'].some((key) => url.searchParams.has(key));
      applyState(parsed.state);
      setIsOverview(isOverviewLocation);
      setUrlNotice(parsed.notice);
      if (!isOverviewLocation) writeHistory(parsed.state, 'replace');
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
    setIsOverview(false);
    navigate({ selectedId: nodeId, viewMode, relationFilter });
  };

  const selectView = (nextView: ExplorerViewMode) => {
    setMobilePanel('map');
    navigate({ selectedId, viewMode: nextView, relationFilter });
  };

  const selectRelationFilter = (nextFilter: ExplorerRelationFilter) => {
    setMobilePanel('map');
    navigate({ selectedId, viewMode: 'relations', relationFilter: nextFilter });
  };

  const handleViewTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    current: ExplorerViewMode,
  ) => {
    const values = Object.keys(viewLabels) as ExplorerViewMode[];
    const next = rovingTarget(event, values, current);
    if (!next) return;
    event.preventDefault();
    selectView(next);
    window.requestAnimationFrame(() => document.getElementById(`explorer-view-tab-${next}`)?.focus());
  };

  const handleMobilePanelKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    current: MobilePanel,
  ) => {
    const values = Object.keys(mobilePanelLabels) as MobilePanel[];
    const next = rovingTarget(event, values, current);
    if (!next) return;
    event.preventDefault();
    setMobilePanel(next);
    window.requestAnimationFrame(() => document.getElementById(`explorer-mobile-tab-${next}`)?.focus());
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
    <section
      className={`explorer-shell mobile-panel-${mobilePanel}${isOverview ? ' is-overview' : ''}`}
      aria-label="業務エクスプローラー"
    >
      <header className="explorer-toolbar">
        <div>
          <p className="explorer-eyebrow">BUSINESS EXPLORER</p>
          <h1>業務エクスプローラー</h1>
          <p>
            {isOverview
              ? '18の業務領域から、確認したいビルメンテナンス業務を探します。'
              : '業務の前後、全体の中の位置、手順・記録・役割との関係を同じ画面で確認します。'}
          </p>
        </div>
        {!isOverview && (
          <div className="explorer-toolbar-controls">
            <div className="explorer-view-tabs" role="tablist" aria-label="表示方法">
              {(Object.keys(viewLabels) as ExplorerViewMode[]).map((mode) => (
                <button
                  id={`explorer-view-tab-${mode}`}
                  data-view-mode={mode}
                  key={mode}
                  type="button"
                  role="tab"
                  tabIndex={viewMode === mode ? 0 : -1}
                  aria-selected={viewMode === mode}
                  aria-controls="explorer-map-panel"
                  className={viewMode === mode ? 'is-active' : ''}
                  onClick={() => selectView(mode)}
                  onKeyDown={(event) => handleViewTabKeyDown(event, mode)}
                >
                  {viewLabels[mode]}
                </button>
              ))}
            </div>
            <p className="explorer-keyboard-help">表示方法は左右矢印キー、Home、Endでも切り替えられます。</p>
            <div className="explorer-share-row">
              <button className="explorer-copy-url" type="button" onClick={copyCurrentUrl}>
                URLをコピー
              </button>
              <span className="explorer-copy-status" role="status" aria-live="polite">{copyStatus}</span>
            </div>
          </div>
        )}
      </header>

      {urlNotice && <p className="explorer-url-notice" role="status">{urlNotice}</p>}

      {isOverview ? (
        <BusinessAreaMap onSelectBusiness={selectNode} />
      ) : (
        <>
          <div className="explorer-mobile-panel-tabs" role="tablist" aria-label="スマートフォン表示">
            {(Object.keys(mobilePanelLabels) as MobilePanel[]).map((panel) => (
              <button
                id={`explorer-mobile-tab-${panel}`}
                key={panel}
                type="button"
                role="tab"
                tabIndex={mobilePanel === panel ? 0 : -1}
                aria-selected={mobilePanel === panel}
                aria-controls={mobilePanelTargets[panel]}
                onClick={() => setMobilePanel(panel)}
                onKeyDown={(event) => handleMobilePanelKeyDown(event, panel)}
              >
                {mobilePanelLabels[panel]}
              </button>
            ))}
          </div>

          <BusinessNavigator selectedId={selectedId} onSelect={selectNode} />

          <main className="explorer-pane explorer-map-pane" aria-labelledby="explorer-map-title">
            <div className="explorer-pane-heading">
              <div>
                <h2 id="explorer-map-title">{viewLabels[viewMode]}</h2>
                <small>{viewDescriptions[viewMode]}</small>
              </div>
              <span>{selectedNode?.id ?? '未選択'}</span>
            </div>
            <div
              id="explorer-map-panel"
              className="explorer-map"
              role="tabpanel"
              aria-labelledby={`explorer-view-tab-${viewMode}`}
              aria-live="polite"
            >
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

          <div id="explorer-detail-mobile-panel" className="explorer-mobile-detail-slot">
            <DetailPanel selectedId={selectedId} onSelect={selectNode} />
          </div>
          <div id="explorer-lifecycle-mobile-panel" className="explorer-mobile-lifecycle-slot">
            <LifecycleNavigator selectedId={selectedId} onSelect={selectNode} />
          </div>
        </>
      )}
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
