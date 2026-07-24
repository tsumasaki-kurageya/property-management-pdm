import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  explorerAreaIdByBusinessId,
  explorerAreasById,
  explorerGraph,
} from '../../data/explorer';
import type { ExplorerNode, ExplorerProcessIndex } from '../../data/explorer/schema';
import './ExplorerSearch.css';

interface ExplorerSearchProps {
  selectedBusinessId?: string;
  selectedProcessId?: string;
  onSelectBusiness: (businessId: string) => void;
  onSelectProcess: (processId: string) => void;
}

interface SearchResult {
  kind: 'business' | 'process';
  id: string;
  label: string;
  context: string;
  description: string;
  searchText: string;
}

const businessResults: SearchResult[] = explorerGraph.nodes
  .filter((node): node is ExplorerNode => node.type === 'business')
  .map((node) => {
    const areaId = explorerAreaIdByBusinessId.get(node.id);
    const area = areaId ? explorerAreasById.get(areaId) : undefined;
    return {
      kind: 'business',
      id: node.id,
      label: node.label,
      context: area ? `${area.id} ${area.label}` : '業務カタログ',
      description: node.description ?? '',
      searchText: `${node.id} ${node.label} ${node.description ?? ''} ${area?.id ?? ''} ${area?.label ?? ''}`,
    };
  });

const processResults: SearchResult[] = explorerGraph.processes.map((process: ExplorerProcessIndex) => ({
  kind: 'process',
  id: process.id,
  label: process.label,
  context: '横断プロセス',
  description: `${process.startTrigger} → ${process.endState}`,
  searchText: `${process.id} ${process.label}`,
}));

const allResults = [...processResults, ...businessResults];

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ja-JP');
}

export default function ExplorerSearch({
  selectedBusinessId,
  selectedProcessId,
  onSelectBusiness,
  onSelectProcess,
}: ExplorerSearchProps) {
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = normalize(query.trim());
  const results = useMemo(
    () => normalizedQuery
      ? allResults.filter((result) => normalize(result.searchText).includes(normalizedQuery))
      : [],
    [normalizedQuery],
  );
  const isOpen = normalizedQuery.length > 0;

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setQuery('');
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, []);

  const choose = (result: SearchResult) => {
    if (result.kind === 'process') onSelectProcess(result.id);
    else onSelectBusiness(result.id);
    setQuery('');
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setQuery('');
      return;
    }
    if (event.key !== 'ArrowDown' || results.length === 0) return;
    event.preventDefault();
    rootRef.current?.querySelector<HTMLButtonElement>('[data-explorer-search-result]')?.focus();
  };

  const handleResultKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    resultIndex: number,
  ) => {
    if (event.key === 'Escape') {
      setQuery('');
      inputRef.current?.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...(rootRef.current?.querySelectorAll<HTMLButtonElement>('[data-explorer-search-result]') ?? [])];
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : event.key === 'ArrowDown'
          ? Math.min(buttons.length - 1, resultIndex + 1)
          : Math.max(0, resultIndex - 1);
    buttons[nextIndex]?.focus();
  };

  return (
    <div ref={rootRef} className="explorer-global-search">
      <label htmlFor="explorer-global-search-input">業務・プロセスを検索</label>
      <div className="explorer-global-search-field">
        <input
          ref={inputRef}
          id="explorer-global-search-input"
          type="search"
          value={query}
          placeholder="業務ID・名称、領域、P01〜P12"
          aria-label="業務ID・名前・説明から検索"
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={handleInputKeyDown}
        />
        {query && (
          <button type="button" aria-label="検索語を消去" onClick={() => setQuery('')}>
            クリア
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id="explorer-global-search-results"
          className="explorer-global-search-results"
          role="region"
          aria-label="業務・プロセスの検索結果"
        >
          <p role="status">{results.length}件見つかりました</p>
          {results.length === 0 ? (
            <div className="explorer-global-search-empty">
              業務ID・名称、18業務領域、またはP01〜P12で検索してください。
            </div>
          ) : (
            results.map((result, index) => {
              const selected = result.kind === 'process'
                ? result.id === selectedProcessId
                : result.id === selectedBusinessId;
              return (
                <button
                  key={`${result.kind}:${result.id}`}
                  type="button"
                  data-explorer-search-result
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => choose(result)}
                  onKeyDown={(event) => handleResultKeyDown(event, index)}
                >
                  <span>{result.context}</span>
                  <strong>{result.id} {result.label}</strong>
                  {result.description && <small>{result.description}</small>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
