import { useMemo } from 'react';
import { explorerNodesById, getExplorerEdgesForNode } from '../../data/explorer';
import type {
  ExplorerBusinessMetadata,
  ExplorerEdge,
  ExplorerNode,
  ExplorerNodeType,
} from '../../data/explorer/schema';
import './DetailPanel.css';

interface DetailPanelProps {
  selectedId: string;
  onSelect: (nodeId: string) => void;
}

interface DetailItem {
  id: string;
  node: ExplorerNode;
  relation: string;
  via?: string;
}

interface DetailSection {
  id: string;
  title: string;
  help: string;
  items: DetailItem[];
  open?: boolean;
}

const BASE_URL = import.meta.env.BASE_URL;

const nodeTypeLabels: Record<ExplorerNodeType, string> = {
  area: '業務領域',
  business: '業務',
  procedure: '作業手順',
  artifact: 'チェックリスト・帳票',
  role: '担当者・関係者',
  standard: '法令・基準',
  process: '横断プロセス',
};

function otherNode(edge: ExplorerEdge, selectedId: string): ExplorerNode | undefined {
  return explorerNodesById.get(edge.from === selectedId ? edge.to : edge.from);
}

function uniqueItems(items: DetailItem[]): DetailItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function metadataText(metadata: ExplorerBusinessMetadata, key: keyof ExplorerBusinessMetadata): string {
  const value = metadata[key];
  return typeof value === 'string' ? value : '';
}

function relatedBusinessLabel(edge: ExplorerEdge, selectedId: string): string {
  if (edge.type === 'precedes') return edge.from === selectedId ? '後続業務' : '前工程';
  if (edge.type === 'branches_to') return edge.from === selectedId ? '条件分岐先' : '分岐元';
  return edge.label || '関連業務';
}

export default function DetailPanel({ selectedId, onSelect }: DetailPanelProps) {
  const node = explorerNodesById.get(selectedId);
  const edges = useMemo(() => getExplorerEdgesForNode(selectedId), [selectedId]);
  const metadata = (node?.metadata ?? {}) as ExplorerBusinessMetadata;

  const sections = useMemo<DetailSection[]>(() => {
    if (!node) return [];
    const itemsForEdges = (
      filteredEdges: ExplorerEdge[],
      relation: (edge: ExplorerEdge) => string,
    ): DetailItem[] => uniqueItems(filteredEdges.flatMap((edge) => {
      const target = otherNode(edge, selectedId);
      return target ? [{ id: target.id, node: target, relation: relation(edge) }] : [];
    }));

    const procedures = itemsForEdges(
      edges.filter((edge) => otherNode(edge, selectedId)?.type === 'procedure'),
      () => '対応する作業手順',
    );
    const procedureChecklistItems = procedures.flatMap((procedure) =>
      getExplorerEdgesForNode(procedure.node.id).flatMap((edge) => {
        const target = otherNode(edge, procedure.node.id);
        if (target?.type !== 'artifact' || target.metadata?.kind !== 'checklist') return [];
        return [{
          id: target.id,
          node: target,
          relation: '実行記録',
          via: procedure.node.id,
        }];
      }));
    const directArtifacts = itemsForEdges(
      edges.filter((edge) => otherNode(edge, selectedId)?.type === 'artifact'),
      (edge) => edge.type === 'uses' ? '入力' : '成果物',
    );

    return [
      {
        id: 'inputs',
        title: '入力',
        help: 'この業務を始める前に必要な情報、資料、記録です。',
        items: itemsForEdges(edges.filter((edge) => edge.type === 'uses'), () => '入力'),
        open: true,
      },
      {
        id: 'outputs',
        title: '成果物',
        help: 'この業務の結果として作成・更新される記録や情報です。',
        items: itemsForEdges(edges.filter((edge) => edge.type === 'produces'), () => '成果物'),
        open: true,
      },
      {
        id: 'performers',
        title: '実施者',
        help: '実作業、調査、確認などを担当する主体です。',
        items: itemsForEdges(edges.filter((edge) => edge.type === 'performed_by'), () => '実施者'),
      },
      {
        id: 'approvers',
        title: '判断者・承認者',
        help: '判断、確認、承認、責任の確定を担う主体です。',
        items: itemsForEdges(edges.filter((edge) => edge.type === 'approved_by'), () => '判断・承認'),
      },
      {
        id: 'standards',
        title: '法令・基準',
        help: '直接関連付けられた法令・基準です。個別物件への適用判断は別途必要です。',
        items: itemsForEdges(edges.filter((edge) => edge.type === 'governed_by'), () => '適用候補'),
      },
      {
        id: 'procedures',
        title: '作業手順',
        help: 'この業務を現場で実施するために接続された標準手順です。',
        items: procedures,
      },
      {
        id: 'forms',
        title: 'チェックリスト・帳票',
        help: '対応手順の実行記録を含む、登録済みのチェックリスト・帳票です。',
        items: uniqueItems([
          ...directArtifacts.filter((item) => item.node.metadata?.kind === 'checklist'),
          ...procedureChecklistItems,
        ]),
      },
      {
        id: 'related',
        title: '関連業務',
        help: '業務ID単位で接続された前後工程、条件分岐、関連業務です。',
        items: itemsForEdges(
          edges.filter((edge) => {
            const target = otherNode(edge, selectedId);
            return target?.type === 'business'
              && ['precedes', 'branches_to', 'related_to'].includes(edge.type);
          }),
          (edge) => relatedBusinessLabel(edge, selectedId),
        ),
        open: true,
      },
    ];
  }, [edges, node, selectedId]);

  if (!node) {
    return (
      <aside className="explorer-pane explorer-detail-pane" aria-labelledby="explorer-detail-title">
        <div className="explorer-pane-heading"><h2 id="explorer-detail-title">業務詳細</h2></div>
        <p className="explorer-empty">対象業務がありません。</p>
      </aside>
    );
  }

  const startTrigger = metadataText(metadata, 'startTrigger');
  const completionCondition = metadataText(metadata, 'completionCondition');

  return (
    <aside className="explorer-pane explorer-detail-pane" aria-labelledby="explorer-detail-title">
      <div className="explorer-pane-heading">
        <div>
          <h2 id="explorer-detail-title">業務詳細</h2>
          <small>正本に登録された業務属性と関連情報</small>
        </div>
        <span>{node.id}</span>
      </div>

      <div className="detail-panel-content">
        <header className="detail-panel-summary">
          <p className={`explorer-node-type type-${node.type}`}>{nodeTypeLabels[node.type]}</p>
          <p className="detail-panel-id">{node.id}</p>
          <h3>{node.label}</h3>
          <dl className="detail-panel-core-fields">
            <div>
              <dt>概要</dt>
              <dd className={node.description ? '' : 'is-unregistered'}>
                {node.description || 'この情報はまだ登録されていません。'}
              </dd>
            </div>
            <div>
              <dt>開始契機</dt>
              <dd className={startTrigger ? '' : 'is-unregistered'}>
                {startTrigger || 'この情報はまだ登録されていません。'}
              </dd>
            </div>
            <div>
              <dt>完了条件</dt>
              <dd className={completionCondition ? '' : 'is-unregistered'}>
                {completionCondition || 'この情報はまだ登録されていません。'}
              </dd>
            </div>
          </dl>
        </header>

        <div className="detail-panel-sections">
          {sections.map((section) => (
            <details key={section.id} open={section.open}>
              <summary>
                <span>{section.title}</span>
                <small>{section.items.length}件</small>
              </summary>
              <div className="detail-section-body">
                <p className="detail-section-help">{section.help}</p>
                {section.items.length === 0 ? (
                  <p className="detail-section-empty">この情報はまだ登録されていません。</p>
                ) : (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item.id}>
                        {item.node.type === 'business' ? (
                          <button type="button" onClick={() => onSelect(item.node.id)}>
                            <span>{item.relation}</span>
                            <strong>{item.node.label}</strong>
                            <small>{item.node.id}</small>
                          </button>
                        ) : (
                          <div className="detail-section-item">
                            <span>{item.relation}</span>
                            <strong>{item.node.label}</strong>
                            <small>
                              {nodeTypeLabels[item.node.type]} · {item.node.id}
                              {item.via ? ` · ${item.via}経由` : ''}
                            </small>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          ))}
        </div>

        <div className="detail-panel-actions">
          {node.href ? (
            <a className="explorer-reference-link" href={`${BASE_URL}${node.href.replace(/^\//, '')}`}>
              詳細ページで確認する
            </a>
          ) : (
            <p className="detail-section-empty">この業務の詳細ページはまだ登録されていません。</p>
          )}
          <p className="explorer-source">
            参照元: <code>{node.source.path}{node.source.anchor ? `#${node.source.anchor}` : ''}</code>
          </p>
        </div>
      </div>
    </aside>
  );
}
