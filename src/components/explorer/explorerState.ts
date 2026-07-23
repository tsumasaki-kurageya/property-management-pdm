import { explorerGraph, explorerNodesById } from '../../data/explorer';

export const explorerViewModes = ['flow', 'hierarchy', 'relations'] as const;
export const explorerRelationFilters = ['all', 'related_to', 'uses', 'produces', 'people', 'governed_by'] as const;

export type ExplorerViewMode = (typeof explorerViewModes)[number];
export type ExplorerRelationFilter = (typeof explorerRelationFilters)[number];

export interface ExplorerUiState {
  selectedId: string;
  viewMode: ExplorerViewMode;
  relationFilter: ExplorerRelationFilter;
}

export interface ParsedExplorerState {
  state: ExplorerUiState;
  notice?: string;
}

const DEFAULT_NODE_ID = 'BM-09-06';

function isOneOf<T extends readonly string[]>(value: string | null, candidates: T): value is T[number] {
  return Boolean(value && candidates.includes(value as T[number]));
}

export function getDefaultExplorerState(): ExplorerUiState {
  const selectedId = explorerNodesById.has(DEFAULT_NODE_ID)
    ? DEFAULT_NODE_ID
    : explorerGraph.nodes.find((node) => node.type === 'business')?.id ?? '';

  return {
    selectedId,
    viewMode: 'flow',
    relationFilter: 'all',
  };
}

export function parseExplorerUrl(url: URL): ParsedExplorerState {
  const fallback = getDefaultExplorerState();
  const requestedId = url.searchParams.get('item')
    ?? url.searchParams.get('business')
    ?? url.searchParams.get('node');
  const requestedView = url.searchParams.get('view');
  const requestedFilter = url.searchParams.get('type');
  const notices: string[] = [];

  const selectedId = requestedId && explorerNodesById.has(requestedId)
    ? requestedId
    : fallback.selectedId;
  if (requestedId && selectedId !== requestedId) {
    notices.push(`指定された項目「${requestedId}」は見つからないため、既定の業務を表示しました。`);
  }

  const viewMode = isOneOf(requestedView, explorerViewModes) ? requestedView : fallback.viewMode;
  if (requestedView && viewMode !== requestedView) {
    notices.push(`指定された表示方法「${requestedView}」は利用できないため、「仕事の流れ」を表示しました。`);
  }

  const relationFilter = isOneOf(requestedFilter, explorerRelationFilters) ? requestedFilter : 'all';
  if (requestedFilter && relationFilter !== requestedFilter) {
    notices.push(`指定された関係分類「${requestedFilter}」は利用できないため、すべての関係を表示します。`);
  }

  return {
    state: { selectedId, viewMode, relationFilter },
    notice: notices.length > 0 ? notices.join(' ') : undefined,
  };
}

export function buildExplorerUrl(currentUrl: URL, state: ExplorerUiState): URL {
  const url = new URL(currentUrl);
  const selectedNode = explorerNodesById.get(state.selectedId);

  for (const key of ['business', 'item', 'node', 'view', 'type']) {
    url.searchParams.delete(key);
  }

  if (selectedNode?.type === 'business') {
    url.searchParams.set('business', state.selectedId);
  } else {
    url.searchParams.set('item', state.selectedId);
  }
  url.searchParams.set('view', state.viewMode);

  if (state.viewMode === 'relations' && state.relationFilter !== 'all') {
    url.searchParams.set('type', state.relationFilter);
  }

  return url;
}
