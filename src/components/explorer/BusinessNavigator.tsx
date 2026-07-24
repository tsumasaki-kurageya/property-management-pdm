import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { explorerGraph, explorerNodesById } from '../../data/explorer';
import type { ExplorerNode } from '../../data/explorer/schema';
import './BusinessNavigator.css';

interface BusinessNavigatorProps {
  selectedId: string;
  onSelect: (nodeId: string) => void;
}

const areaNodes = explorerGraph.nodes
  .filter((node): node is ExplorerNode => node.type === 'area')
  .sort((left, right) => left.id.localeCompare(right.id));

const businessNodes = explorerGraph.nodes
  .filter((node): node is ExplorerNode => node.type === 'business')
  .sort((left, right) => left.id.localeCompare(right.id));

const areaIdByBusinessId = new Map<string, string>();
const businessIdsByAreaId = new Map<string, string[]>();

for (const edge of explorerGraph.edges) {
  if (edge.type !== 'contains') continue;
  const parent = explorerNodesById.get(edge.from);
  const child = explorerNodesById.get(edge.to);
  if (parent?.type !== 'area' || child?.type !== 'business') continue;
  areaIdByBusinessId.set(child.id, parent.id);
  const businessIds = businessIdsByAreaId.get(parent.id) ?? [];
  businessIds.push(child.id);
  businessIdsByAreaId.set(parent.id, businessIds);
}

for (const businessIds of businessIdsByAreaId.values()) businessIds.sort((left, right) => left.localeCompare(right));

function normalizedSearchText(node: ExplorerNode): string {
  return `${node.id} ${node.label} ${node.description ?? ''}`.normalize('NFKC').toLocaleLowerCase('ja-JP');
}

function areaForBusiness(nodeId: string): ExplorerNode | undefined {
  const areaId = areaIdByBusinessId.get(nodeId);
  return areaId ? explorerNodesById.get(areaId) : undefined;
}

export default function BusinessNavigator({ selectedId, onSelect }: BusinessNavigatorProps) {
  const selectedNode = explorerNodesById.get(selectedId);
  const selectedAreaId = selectedNode?.type === 'area'
    ? selectedNode.id
    : selectedNode?.type === 'business'
      ? areaIdByBusinessId.get(selectedNode.id)
      : undefined;
  const [query, setQuery] = useState('');
  const [expandedAreaIds, setExpandedAreaIds] = useState<Set<string>>(
    () => new Set(selectedAreaId ? [selectedAreaId] : [areaNodes[0]?.id].filter(Boolean) as string[]),
  );
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = query.trim().normalize('NFKC').toLocaleLowerCase('ja-JP');
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return businessNodes.filter((node) => normalizedSearchText(node).includes(normalizedQuery));
  }, [normalizedQuery]);

  useEffect(() => {
    if (!selectedAreaId) return;
    setExpandedAreaIds((current) => {
      if (current.has(selectedAreaId)) return current;
      const next = new Set(current);
      next.add(selectedAreaId);
      return next;
    });
  }, [selectedAreaId]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 0);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setDrawerOpen(false);
      openerRef.current?.focus();
    };
    document.body.classList.add('explorer-drawer-open');
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.classList.remove('explorer-drawer-open');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isDrawerOpen]);

  const selectBusiness = (businessId: string) => {
    onSelect(businessId);
    setDrawerOpen(false);
  };

  const toggleArea = (areaId: string, forceOpen?: boolean) => {
    setExpandedAreaIds((current) => {
      const next = new Set(current);
      const shouldOpen = forceOpen ?? !next.has(areaId);
      if (shouldOpen) next.add(areaId);
      else next.delete(areaId);
      return next;
    });
  };

  const moveTreeFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.matches('[data-tree-item]')) return;
    const items = [...(navigationRef.current?.querySelectorAll<HTMLElement>('[data-tree-item]:not([disabled])') ?? [])]
      .filter((item) => item.offsetParent !== null);
    const currentIndex = items.indexOf(target);
    if (currentIndex < 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const nextIndex = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : event.key === 'ArrowDown'
            ? Math.min(items.length - 1, currentIndex + 1)
            : Math.max(0, currentIndex - 1);
      items[nextIndex]?.focus();
      return;
    }

    const areaId = target.dataset.areaId;
    if (!areaId) return;
    if (target.dataset.areaToggle === 'true' && event.key === 'ArrowRight') {
      event.preventDefault();
      toggleArea(areaId, true);
    }
    if (target.dataset.areaToggle === 'true' && event.key === 'ArrowLeft') {
      event.preventDefault();
      toggleArea(areaId, false);
    }
    if (target.dataset.businessId && event.key === 'ArrowLeft') {
      event.preventDefault();
      navigationRef.current?.querySelector<HTMLElement>(`[data-area-toggle="true"][data-area-id="${areaId}"]`)?.focus();
    }
  };

  const focusFirstResult = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowDown') return;
    const firstItem = navigationRef.current?.querySelector<HTMLElement>('[data-tree-item]');
    if (!firstItem) return;
    event.preventDefault();
    firstItem.focus();
  };

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        className="explorer-mobile-search-trigger"
        aria-expanded={isDrawerOpen}
        aria-controls="explorer-business-navigator"
        onClick={() => setDrawerOpen(true)}
      >
        <span>業務を探す</span>
        <strong>{selectedNode?.type === 'business' ? selectedNode.label : '18領域から選択'}</strong>
      </button>

      {isDrawerOpen && (
        <button
          type="button"
          className="explorer-drawer-backdrop"
          aria-label="業務選択を閉じる"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        id="explorer-business-navigator"
        className={`explorer-pane explorer-list-pane${isDrawerOpen ? ' is-open' : ''}`}
        aria-labelledby="explorer-list-title"
      >
        <div className="explorer-pane-heading">
          <div>
            <h2 id="explorer-list-title">業務を探す</h2>
            <span>18領域・{businessNodes.length}業務</span>
          </div>
          <button
            type="button"
            className="explorer-drawer-close"
            aria-label="業務選択を閉じる"
            onClick={() => {
              setDrawerOpen(false);
              openerRef.current?.focus();
            }}
          >
            ×
          </button>
        </div>

        <label className="explorer-search">
          <span>業務一覧を絞り込む</span>
          <div className="explorer-search-field">
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              placeholder="例: BM-09-06、点検異常"
              aria-describedby="explorer-search-status"
              onChange={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={focusFirstResult}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="検索語を消去">
                クリア
              </button>
            )}
          </div>
        </label>

        <p id="explorer-search-status" className="explorer-search-status" aria-live="polite">
          {normalizedQuery ? `${searchResults.length}件の業務が見つかりました` : '領域を開いて業務を選択してください'}
        </p>

        <div
          ref={navigationRef}
          className="explorer-business-navigation"
          onKeyDown={moveTreeFocus}
        >
          {normalizedQuery ? (
            <div className="explorer-search-results" role="listbox" aria-label="業務の検索結果">
              {searchResults.length === 0 ? (
                <div className="explorer-empty explorer-search-empty">
                  <strong>該当する業務がありません</strong>
                  <p>業務IDを短くするか、別の言葉で検索してください。</p>
                  <button type="button" onClick={() => setQuery('')}>18領域から探す</button>
                </div>
              ) : (
                searchResults.map((node) => {
                  const area = areaForBusiness(node.id);
                  return (
                    <button
                      type="button"
                      key={node.id}
                      role="option"
                      data-tree-item
                      data-business-id={node.id}
                      data-area-id={area?.id}
                      aria-selected={node.id === selectedId}
                      className={`explorer-business-item${node.id === selectedId ? ' is-selected' : ''}`}
                      onClick={() => selectBusiness(node.id)}
                    >
                      <span className="explorer-business-context">{area ? `${area.id} ${area.label}` : '業務カタログ'}</span>
                      <strong>{node.label}</strong>
                      <span className="explorer-business-id">{node.id}</span>
                      {node.description && <small>{node.description}</small>}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="explorer-area-tree" role="tree" aria-label="18の業務領域">
              {areaNodes.map((area) => {
                const businessIds = businessIdsByAreaId.get(area.id) ?? [];
                const isExpanded = expandedAreaIds.has(area.id);
                const isCurrentArea = area.id === selectedAreaId;
                return (
                  <section key={area.id} className={`explorer-area-group${isCurrentArea ? ' is-current' : ''}`}>
                    <button
                      type="button"
                      role="treeitem"
                      data-tree-item
                      data-area-toggle="true"
                      data-area-id={area.id}
                      aria-expanded={isExpanded}
                      className="explorer-area-toggle"
                      onClick={() => toggleArea(area.id)}
                    >
                      <span className="explorer-area-chevron" aria-hidden="true">{isExpanded ? '−' : '+'}</span>
                      <span className="explorer-area-copy">
                        <strong>{area.label}</strong>
                        <small>{area.id}</small>
                      </span>
                      <span className="explorer-area-count">{businessIds.length}</span>
                    </button>

                    {isExpanded && (
                      <div role="group" className="explorer-area-businesses">
                        {businessIds.map((businessId) => {
                          const business = explorerNodesById.get(businessId);
                          if (!business) return null;
                          return (
                            <button
                              type="button"
                              role="treeitem"
                              key={business.id}
                              data-tree-item
                              data-business-id={business.id}
                              data-area-id={area.id}
                              aria-current={business.id === selectedId ? 'true' : undefined}
                              className={`explorer-business-item${business.id === selectedId ? ' is-selected' : ''}`}
                              onClick={() => selectBusiness(business.id)}
                            >
                              <strong>{business.label}</strong>
                              <span className="explorer-business-id">{business.id}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
