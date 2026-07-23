import { useMemo } from 'react';
import { explorerGraph, explorerNodesById, getExplorerEdgesForNode } from '../../data/explorer';
import './LifecycleNavigator.css';

interface LifecycleNavigatorProps {
  selectedId: string;
  onSelect: (nodeId: string) => void;
}

function firstBusinessInStage(stageId: string): string | undefined {
  const stage = explorerGraph.lifecycleStages.find((item) => item.id === stageId);
  if (!stage) return undefined;
  for (const processId of stage.processIds) {
    const process = explorerGraph.processes.find((item) => item.id === processId);
    const businessId = process?.entryBusinessIds.find((id) => explorerNodesById.has(id));
    if (businessId) return businessId;
  }
  return undefined;
}

export default function LifecycleNavigator({ selectedId, onSelect }: LifecycleNavigatorProps) {
  const node = explorerNodesById.get(selectedId);
  const edges = useMemo(() => getExplorerEdgesForNode(selectedId), [selectedId]);
  const lifecycleIds = useMemo(
    () => new Set(edges
      .filter((edge) => edge.type === 'participates_in' && edge.to.startsWith('LC-'))
      .map((edge) => edge.to)),
    [edges],
  );
  const processIds = useMemo(
    () => new Set(edges
      .filter((edge) => edge.type === 'participates_in' && edge.to.startsWith('P'))
      .map((edge) => edge.to)),
    [edges],
  );
  const currentStages = explorerGraph.lifecycleStages.filter((stage) => lifecycleIds.has(stage.id));
  const currentProcesses = explorerGraph.processes.filter((process) => processIds.has(process.id));

  const selectStage = (stageId: string) => {
    const firstBusiness = firstBusinessInStage(stageId);
    if (firstBusiness) onSelect(firstBusiness);
  };

  return (
    <footer className="explorer-lifecycle lifecycle-navigator" aria-labelledby="explorer-lifecycle-title">
      <div className="lifecycle-heading">
        <p className="explorer-eyebrow">LIFECYCLE</p>
        <h2 id="explorer-lifecycle-title">契約から改善までの現在位置</h2>
        <p>
          {node
            ? `${node.label}が業務全体のどの段階に属するかを示します。`
            : '選択中の項目がありません。'}
        </p>
      </div>

      <div className="lifecycle-body">
        <ol aria-label="業務ライフサイクル">
          {explorerGraph.lifecycleStages.map((stage, index) => {
            const isCurrent = lifecycleIds.has(stage.id);
            const firstBusiness = firstBusinessInStage(stage.id);
            return (
              <li key={stage.id} className={isCurrent ? 'is-current' : ''}>
                <button
                  type="button"
                  aria-current={isCurrent ? 'step' : undefined}
                  disabled={!firstBusiness}
                  onClick={() => selectStage(stage.id)}
                  title={firstBusiness ? `${stage.label}の先頭業務へ移動` : '先頭業務は未登録です'}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{stage.label}</strong>
                  <small>{stage.processIds.join('・')}</small>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="lifecycle-current-summary" aria-live="polite">
          {currentStages.length === 0 ? (
            <div className="lifecycle-unregistered">
              <strong>現在位置の情報未登録</strong>
              <span>この項目にはライフサイクル段階がまだ関連付けられていません。</span>
            </div>
          ) : (
            <>
              <div>
                <span>現在の段階</span>
                <strong>{currentStages.map((stage) => stage.label).join('、')}</strong>
              </div>
              <div className="lifecycle-processes">
                <span>所属する横断プロセス</span>
                <ul>
                  {currentProcesses.length === 0 ? (
                    <li className="is-unregistered">プロセス情報未登録</li>
                  ) : currentProcesses.map((process) => {
                    const processNode = explorerNodesById.get(process.id);
                    const target = process.entryBusinessIds.find((id) => explorerNodesById.has(id));
                    return (
                      <li key={process.id}>
                        <button type="button" disabled={!target} onClick={() => target && onSelect(target)}>
                          <span>{process.id}</span>
                          <strong>{processNode?.label || '名称未登録'}</strong>
                          <small>{process.businessIds.length}業務</small>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
