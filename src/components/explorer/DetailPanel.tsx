import { useMemo } from 'react';
import { explorerNodesById, getExplorerEdgesForNode } from '../../data/explorer';
import type { ExplorerEdge, ExplorerNode, ExplorerNodeType } from '../../data/explorer/schema';
import './DetailPanel.css';

interface DetailPanelProps {
  selectedId: string;
  onSelect: (nodeId: string) => void;
}

const BASE_URL = import.meta.env.BASE_URL;

const nodeTypeLabels: Record<ExplorerNodeType, string> = {
  area: '業務領域',
  business: '業務',
  procedure: '詳しい手順',
  artifact: '記録・帳票',
  role: '担当者・関係者',
  standard: '法令・基準',
  lifecycle: 'ライフサイクル段階',
  process: '横断プロセス',
};

interface DetailSection {
  id: string;
  title: string;
  help: string;
  edges: ExplorerEdge[];
  open?: boolean;
  applicableTypes?: ExplorerNodeType[];
}

function otherNode(edge: ExplorerEdge, selectedId: string): ExplorerNode | undefined {
  return explorerNodesById.get(edge.from === selectedId ? edge.to : edge.from);
}

function relationText(edge: ExplorerEdge, selectedId: string): string {
  const outgoing = edge.from === selectedId;
  const labels: Record<ExplorerEdge['type'], [string, string]> = {
    contains: ['含まれる項目', '一つ上のまとまり'],
    precedes: ['この後の仕事', 'この前の仕事'],
    branches_to: ['条件による次の仕事', '分岐元の仕事'],
    uses: ['この仕事に必要', 'この項目を使う仕事'],
    produces: ['この仕事で作成', 'この項目を作る仕事'],
    performed_by: ['主な担当者', 'この担当者が行う仕事'],
    approved_by: ['確認・承認する人', 'この人が確認する仕事'],
    governed_by: ['関係する法令・基準', 'この基準が関係する仕事'],
    participates_in: ['全体の中の位置', 'この段階に属する仕事'],
    related_to: ['関連する項目', '関連する項目'],
  };
  return edge.label || labels[edge.type][outgoing ? 0 : 1];
}

function emptyMessage(node: ExplorerNode, section: DetailSection): string {
  if (section.applicableTypes && !section.applicableTypes.includes(node.type)) {
    return 'この種類の項目には該当しません。';
  }
  return 'この情報はまだ登録されていません。';
}

function uniqueEdges(edges: ExplorerEdge[]): ExplorerEdge[] {
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = `${edge.type}:${edge.from}:${edge.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function DetailPanel({ selectedId, onSelect }: DetailPanelProps) {
  const node = explorerNodesById.get(selectedId);
  const edges = useMemo(() => getExplorerEdgesForNode(selectedId), [selectedId]);

  const sections = useMemo<DetailSection[]>(() => {
    if (!node) return [];

    const relatedWork = edges.filter((edge) => {
      const target = otherNode(edge, selectedId);
      return Boolean(target && ['area', 'business', 'procedure'].includes(target.type)
        && ['contains', 'precedes', 'branches_to', 'related_to'].includes(edge.type));
    });

    return [
      {
        id: 'needs',
        title: 'この仕事に必要なもの',
        help: '作業前に確認・参照する資料、台帳、記録などです。',
        edges: edges.filter((edge) => edge.type === 'uses'),
        open: true,
        applicableTypes: ['business', 'procedure'],
      },
      {
        id: 'outputs',
        title: 'この仕事で作られるもの',
        help: 'この仕事の結果として残る記録、報告、帳票などです。',
        edges: edges.filter((edge) => edge.type === 'produces'),
        open: true,
        applicableTypes: ['business', 'procedure'],
      },
      {
        id: 'people',
        title: '担当・確認する人',
        help: '実施者、責任者、確認者、承認者として登録された関係者です。',
        edges: edges.filter((edge) => edge.type === 'performed_by' || edge.type === 'approved_by'),
        applicableTypes: ['business', 'procedure'],
      },
      {
        id: 'standards',
        title: '関係する法令・基準',
        help: 'この項目へ直接関連付けられた法令・基準です。個別物件への適用判断を示すものではありません。',
        edges: edges.filter((edge) => edge.type === 'governed_by'),
        applicableTypes: ['business', 'procedure'],
      },
      {
        id: 'related',
        title: '前後・関連する仕事',
        help: '前後工程、条件分岐、上位・下位、主要な関連業務です。',
        edges: relatedWork,
        open: true,
      },
    ].map((section) => ({ ...section, edges: uniqueEdges(section.edges) }));
  }, [edges, node, selectedId]);

  if (!node) {
    return (
      <aside className="explorer-pane explorer-detail-pane" aria-labelledby="explorer-detail-title">
        <div className="explorer-pane-heading">
          <h2 id="explorer-detail-title">選択中の項目</h2>
        </div>
        <p className="explorer-empty">対象項目がありません。</p>
      </aside>
    );
  }

  return (
    <aside className="explorer-pane explorer-detail-pane" aria-labelledby="explorer-detail-title">
      <div className="explorer-pane-heading">
        <div>
          <h2 id="explorer-detail-title">選択中の項目</h2>
          <small>図だけでは分からない説明と登録情報</small>
        </div>
        <span>{edges.length}関係</span>
      </div>

      <div className="detail-panel-content">
        <header className="detail-panel-summary">
          <p className={`explorer-node-type type-${node.type}`}>{nodeTypeLabels[node.type]}</p>
          <p className="detail-panel-id">{node.id}</p>
          <h3>{node.label}</h3>
          <p className={node.description ? '' : 'is-unregistered'}>
            {node.description || '初学者向けの説明はまだ登録されていません。'}
          </p>
        </header>

        <div className="detail-panel-sections">
          {sections.map((section) => (
            <details key={section.id} open={section.open}>
              <summary>
                <span>{section.title}</span>
                <small>{section.edges.length}件</small>
              </summary>
              <div className="detail-section-body">
                <p className="detail-section-help">{section.help}</p>
                {section.edges.length === 0 ? (
                  <p className="detail-section-empty">{emptyMessage(node, section)}</p>
                ) : (
                  <ul>
                    {section.edges.map((edge) => {
                      const target = otherNode(edge, selectedId);
                      if (!target) return null;
                      return (
                        <li key={edge.id}>
                          <button type="button" onClick={() => onSelect(target.id)}>
                            <span>{relationText(edge, selectedId)}</span>
                            <strong>{target.label}</strong>
                            <small>{nodeTypeLabels[target.type]} · {target.id}</small>
                          </button>
                        </li>
                      );
                    })}
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
            <p className="detail-section-empty">この項目の詳細ページはまだ登録されていません。</p>
          )}
          <p className="explorer-source">参照元: <code>{node.source.path}</code></p>
        </div>
      </div>
    </aside>
  );
}
