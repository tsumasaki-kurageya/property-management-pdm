import { useMemo } from 'react';
import {
  explorerNodesById,
  explorerProcessIdsByBusinessId,
  explorerProcessesById,
} from '../../data/explorer';
import type { ExplorerProcessIndex } from '../../data/explorer/schema';
import './ProcessNavigator.css';

interface ProcessNavigatorProps {
  selectedBusinessId: string;
  selectedProcessId?: string;
  onSelect: (processId: string) => void;
}

function processesForBusiness(businessId: string): ExplorerProcessIndex[] {
  return (explorerProcessIdsByBusinessId.get(businessId) ?? [])
    .map((processId) => explorerProcessesById.get(processId))
    .filter((process): process is ExplorerProcessIndex => process !== undefined)
    .sort((left, right) => left.order - right.order);
}

export default function ProcessNavigator({
  selectedBusinessId,
  selectedProcessId,
  onSelect,
}: ProcessNavigatorProps) {
  const business = explorerNodesById.get(selectedBusinessId);
  const processes = useMemo(
    () => processesForBusiness(selectedBusinessId),
    [selectedBusinessId],
  );

  return (
    <section className="process-navigator" aria-labelledby="process-navigator-title">
      <div className="process-navigator-heading">
        <div>
          <span>選択業務</span>
          <strong>{business ? `${business.id} ${business.label}` : selectedBusinessId}</strong>
        </div>
        <p id="process-navigator-title">この業務を含むプロセス</p>
        <small>{processes.length}件</small>
      </div>

      {processes.length === 0 ? (
        <p className="process-navigator-empty">
          この業務を含む業務プロセスは未登録です。
        </p>
      ) : (
        <div className="process-navigator-list" role="list" aria-label="この業務を含むプロセス">
          {processes.map((process) => {
            const isSelected = process.id === selectedProcessId;
            return (
              <div key={process.id} role="listitem" className="process-navigator-item">
                <button
                  type="button"
                  className={`process-node${isSelected ? ' is-selected' : ''}`}
                  aria-pressed={isSelected}
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onSelect(process.id)}
                >
                  <span className="process-node-header">
                    <span className="process-node-id">{process.id}</span>
                    {isSelected && <span className="process-node-current">表示中</span>}
                  </span>
                  <strong>{process.label}</strong>
                  <span className="process-node-range">
                    <span>開始: {process.startTrigger}</span>
                    <span>完了: {process.endState}</span>
                  </span>
                  <small>{process.businessIds.length}業務を含む</small>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
