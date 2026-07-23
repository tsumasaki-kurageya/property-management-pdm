import {
  explorerGraph,
  explorerNodesById,
  explorerProcessIdsByBusinessId,
  explorerProcessesById,
} from '../../data/explorer';

export const explorerViewModes = ['flow', 'hierarchy', 'relations'] as const;
export const explorerRelationFilters = ['all', 'related_to', 'uses', 'produces', 'people', 'governed_by'] as const;

export type ExplorerViewMode = (typeof explorerViewModes)[number];
export type ExplorerRelationFilter = (typeof explorerRelationFilters)[number];

export interface ExplorerUiState {
  selectedId: string;
  selectedProcessId?: string;
  viewMode: ExplorerViewMode;
  relationFilter: ExplorerRelationFilter;
}

export interface ParsedExplorerState {
  state: ExplorerUiState;
  notice?: string;
}

const DEFAULT_NODE_ID = 'BM-09-06';

export function resolveExplorerProcessId(
  selectedId: string,
  currentProcessId?: string,
): string | undefined {
  const processIds = explorerProcessIdsByBusinessId.get(selectedId) ?? [];
  if (currentProcessId && processIds.includes(currentProcessId)) return currentProcessId;

  return processIds
    .map((processId) => explorerProcessesById.get(processId))
    .filter((process) => process !== undefined)
    .sort((left, right) => left.order - right.order)[0]?.id;
}

function isOneOf<T extends readonly string[]>(value: string | null, candidates: T): value is T[number] {
  return Boolean(value && candidates.includes(value as T[number]));
}

export function getDefaultExplorerState(): ExplorerUiState {
  const selectedId = explorerNodesById.has(DEFAULT_NODE_ID)
    ? DEFAULT_NODE_ID
    : explorerGraph.nodes.find((node) => node.type === 'business')?.id ?? '';

  return {
    selectedId,
    selectedProcessId: resolveExplorerProcessId(selectedId),
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
  const requestedProcessId = url.searchParams.get('process');
  const notices: string[] = [];

  const selectedId = requestedId && explorerNodesById.has(requestedId)
    ? requestedId
    : fallback.selectedId;
  if (requestedId && selectedId !== requestedId) {
    notices.push(`指定された項目「${requestedId}」は見つからないため、既定の業務を表示しました。`);
  }

  const selectedProcessId = resolveExplorerProcessId(selectedId, requestedProcessId ?? undefined);
  if (requestedProcessId && selectedProcessId !== requestedProcessId) {
    notices.push(
      `指定されたプロセス「${requestedProcessId}」には選択業務が含まれないため、先頭のプロセスを表示しました。`,
    );
  }

  const viewMode = isOneOf(requestedView, explorerViewModes) ? requestedView : fallback.viewMode;
  if (requestedView && viewMode !== requestedView) {
    notices.push(`指定された表示方法「${requestedView}」は利用できないため、「仕事の流れ」を表示しました。`);
  }

  let relationFilter: ExplorerRelationFilter = 'all';
  if (viewMode === 'relations' && requestedFilter) {
    if (isOneOf(requestedFilter, explorerRelationFilters)) {
      relationFilter = requestedFilter;
    } else {
      notices.push(`指定された関係分類「${requestedFilter}」は利用できないため、すべての関係を表示します。`);
    }
  } else if (requestedFilter) {
    notices.push('関係分類は「関係から探す」表示でのみ使用するため、指定を解除しました。');
  }

  return {
    state: { selectedId, selectedProcessId, viewMode, relationFilter },
    notice: notices.length > 0 ? notices.join(' ') : undefined,
  };
}

export function buildExplorerUrl(currentUrl: URL, state: ExplorerUiState): URL {
  const url = new URL(currentUrl);
  const selectedNode = explorerNodesById.get(state.selectedId);

  for (const key of ['business', 'item', 'node', 'process', 'view', 'type']) {
    url.searchParams.delete(key);
  }

  if (selectedNode?.type === 'business') {
    url.searchParams.set('business', state.selectedId);
  } else {
    url.searchParams.set('item', state.selectedId);
  }
  if (selectedNode?.type === 'business' && state.selectedProcessId) {
    url.searchParams.set('process', state.selectedProcessId);
  }
  url.searchParams.set('view', state.viewMode);

  if (state.viewMode === 'relations' && state.relationFilter !== 'all') {
    url.searchParams.set('type', state.relationFilter);
  }

  return url;
}
