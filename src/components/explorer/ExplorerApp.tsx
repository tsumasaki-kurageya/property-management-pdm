import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { explorerNodesById } from '../../data/explorer';
import BusinessAreaMap from './BusinessAreaMap';
import DetailPanel from './DetailPanel';
import ExplorerSearch from './ExplorerSearch';
import FlowMap from './FlowMap';
import {
  buildExplorerUrl,
  getDefaultExplorerState,
  openExplorerProcess,
  parseExplorerUrl,
  selectExplorerBusiness,
  selectExplorerProcess,
  showExplorerOverview,
  type ExplorerUiState,
} from './explorerState';
import './ExplorerShell.css';
import './ExplorerStateControls.css';
import './ExplorerQuality.css';

type MobilePanel = 'map' | 'detail';

const mobilePanelLabels: Record<MobilePanel, string> = {
  map: 'プロセスを見る',
  detail: '業務詳細を見る',
};

const mobilePanelTargets: Record<MobilePanel, string> = {
  map: 'explorer-map-panel',
  detail: 'explorer-detail-mobile-panel',
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
  const [explorerState, setExplorerState] = useState<ExplorerUiState>(initialState);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('map');
  const [urlNotice, setUrlNotice] = useState<string>();
  const [copyStatus, setCopyStatus] = useState('');
  const copyTimer = useRef<number | undefined>(undefined);
  const {
    screen,
    selectedBusinessId,
    selectedProcessId,
  } = explorerState;
  const isOverview = screen === 'overview';
  const selectedNode = selectedBusinessId
    ? explorerNodesById.get(selectedBusinessId)
    : undefined;

  const applyState = (state: ExplorerUiState) => {
    setExplorerState(state);
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

  const selectBusiness = (businessId: string) => {
    const nextState = selectExplorerBusiness(explorerState, businessId);
    if (!nextState) return;
    navigate(nextState);
  };

  const selectProcess = (nextProcessId: string) => {
    const nextState = selectExplorerProcess(explorerState, nextProcessId);
    if (!nextState) return;
    navigate(nextState);
  };

  const openProcess = (nextProcessId: string) => {
    const nextState = openExplorerProcess(explorerState, nextProcessId);
    if (!nextState) return;
    setMobilePanel('map');
    navigate(nextState);
  };

  const showOverview = () => {
    setMobilePanel('map');
    navigate(showExplorerOverview(explorerState));
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
      explorerState,
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
              : '選択業務を含む横断プロセスを開始から終了まで確認し、右側で詳細と関連業務を参照します。'}
          </p>
        </div>
        <div className="explorer-toolbar-actions">
          <ExplorerSearch
            selectedBusinessId={selectedBusinessId}
            selectedProcessId={selectedProcessId}
            onSelectBusiness={selectBusiness}
            onSelectProcess={openProcess}
          />
          {!isOverview && (
            <div className="explorer-toolbar-controls">
              <button className="explorer-overview-button" type="button" onClick={showOverview}>
                全体の業務地図へ戻る
              </button>
              <div className="explorer-share-row">
                <button className="explorer-copy-url" type="button" onClick={copyCurrentUrl}>
                  URLをコピー
                </button>
                <span className="explorer-copy-status" role="status" aria-live="polite">{copyStatus}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {urlNotice && <p className="explorer-url-notice" role="status">{urlNotice}</p>}

      {isOverview ? (
        <BusinessAreaMap onSelectBusiness={selectBusiness} />
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

          <main className="explorer-pane explorer-map-pane" aria-labelledby="explorer-map-title">
            <div className="explorer-pane-heading">
              <div>
                <h2 id="explorer-map-title">業務プロセス</h2>
                <small>選択業務を含む横断プロセスを開始から終了まで表示</small>
              </div>
              <span>{selectedNode?.id ?? '未選択'}</span>
            </div>
            <div
              id="explorer-map-panel"
              className="explorer-map"
              aria-labelledby="explorer-map-title"
              aria-live="polite"
            >
              <FlowMap
                selectedId={selectedBusinessId ?? ''}
                selectedProcessId={selectedProcessId}
                onSelect={selectBusiness}
                onProcessSelect={selectProcess}
              />
            </div>
          </main>

          <div id="explorer-detail-mobile-panel" className="explorer-mobile-detail-slot">
            <DetailPanel selectedId={selectedBusinessId ?? ''} onSelect={selectBusiness} />
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
