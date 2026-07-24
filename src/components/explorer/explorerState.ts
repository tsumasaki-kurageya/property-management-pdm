import {
  explorerGraph,
  explorerNodesById,
  explorerProcessIdsByBusinessId,
  explorerProcessesById,
} from '../../data/explorer';

export type ExplorerScreen = 'overview' | 'process';

export interface ExplorerUiState {
  screen: ExplorerScreen;
  selectedBusinessId?: string;
  selectedProcessId?: string;
}

export interface ParsedExplorerState {
  state: ExplorerUiState;
  notice?: string;
}

const DEFAULT_NODE_ID = 'BM-09-06';

function isBusinessId(nodeId: string): boolean {
  return explorerNodesById.get(nodeId)?.type === 'business';
}

export function resolveExplorerProcessId(
  selectedBusinessId: string,
  currentProcessId?: string,
): string | undefined {
  const processIds = explorerProcessIdsByBusinessId.get(selectedBusinessId) ?? [];
  if (currentProcessId && processIds.includes(currentProcessId)) return currentProcessId;

  return processIds
    .map((processId) => explorerProcessesById.get(processId))
    .filter((process) => process !== undefined)
    .sort((left, right) => left.order - right.order)[0]?.id;
}

export function getDefaultExplorerState(): ExplorerUiState {
  return {
    screen: 'overview',
    selectedBusinessId: undefined,
    selectedProcessId: undefined,
  };
}

export function selectExplorerBusiness(
  state: ExplorerUiState,
  businessId: string,
): ExplorerUiState | undefined {
  if (!isBusinessId(businessId)) return undefined;

  return {
    ...state,
    screen: 'process',
    selectedBusinessId: businessId,
    selectedProcessId: resolveExplorerProcessId(businessId, state.selectedProcessId),
  };
}

export function selectExplorerProcess(
  state: ExplorerUiState,
  processId: string,
): ExplorerUiState | undefined {
  if (!state.selectedBusinessId) return undefined;
  const selectedProcessId = resolveExplorerProcessId(state.selectedBusinessId, processId);
  if (selectedProcessId !== processId) return undefined;

  return { ...state, screen: 'process', selectedProcessId };
}

export function openExplorerProcess(
  state: ExplorerUiState,
  processId: string,
): ExplorerUiState | undefined {
  const process = explorerProcessesById.get(processId);
  if (!process) return undefined;
  const selectedBusinessId = process.entryBusinessIds[0] ?? process.businessIds[0];
  if (!selectedBusinessId || !isBusinessId(selectedBusinessId)) return undefined;

  return {
    ...state,
    screen: 'process',
    selectedBusinessId,
    selectedProcessId: process.id,
  };
}

export function showExplorerOverview(state: ExplorerUiState): ExplorerUiState {
  return {
    ...state,
    screen: 'overview',
    selectedBusinessId: undefined,
    selectedProcessId: undefined,
  };
}

export function parseExplorerUrl(url: URL): ParsedExplorerState {
  const fallback = getDefaultExplorerState();
  const requestedId = url.searchParams.get('business')
    ?? url.searchParams.get('item')
    ?? url.searchParams.get('node');
  const requestedProcessId = url.searchParams.get('process');
  const notices: string[] = [];

  if (!requestedId) {
    return { state: fallback };
  }

  const fallbackBusinessId = isBusinessId(DEFAULT_NODE_ID)
    ? DEFAULT_NODE_ID
    : explorerGraph.nodes.find((node) => node.type === 'business')?.id;
  const selectedBusinessId = isBusinessId(requestedId)
    ? requestedId
    : fallbackBusinessId;
  if (selectedBusinessId !== requestedId) {
    notices.push(`指定された業務「${requestedId}」は見つからないため、既定の業務を表示しました。`);
  }

  const selectedProcessId = selectedBusinessId
    ? resolveExplorerProcessId(selectedBusinessId, requestedProcessId ?? undefined)
    : undefined;
  if (requestedProcessId && selectedProcessId !== requestedProcessId) {
    notices.push(
      `指定されたプロセス「${requestedProcessId}」には選択業務が含まれないため、先頭のプロセスを表示しました。`,
    );
  }

  return {
    state: {
      screen: 'process',
      selectedBusinessId,
      selectedProcessId,
    },
    notice: notices.length > 0 ? notices.join(' ') : undefined,
  };
}

export function buildExplorerUrl(currentUrl: URL, state: ExplorerUiState): URL {
  const url = new URL(currentUrl);

  for (const key of ['business', 'item', 'node', 'process', 'view', 'type']) {
    url.searchParams.delete(key);
  }

  if (state.screen === 'process' && state.selectedBusinessId) {
    url.searchParams.set('business', state.selectedBusinessId);
  }
  if (state.screen === 'process' && state.selectedProcessId) {
    url.searchParams.set('process', state.selectedProcessId);
  }

  return url;
}
