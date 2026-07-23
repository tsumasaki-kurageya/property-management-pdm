import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge as ReactFlowEdge,
  type Node as ReactFlowNode,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import {
  explorerNodesById,
  explorerProcessIdsByBusinessId,
  explorerProcessesById,
} from '../../data/explorer';
import type {
  ExplorerProcessBranch,
  ExplorerProcessIndex,
  ExplorerProcessStep,
} from '../../data/explorer/schema';
import { useExplorerMediaPreferences } from './explorerMedia';
import './FlowMap.css';

interface FlowMapProps {
  selectedId: string;
  onSelect: (nodeId: string) => void;
}

type FlowMapState = 'loading' | 'ready' | 'error';
type AuxiliaryKind = 'start' | 'condition' | 'transition' | 'end';

interface ProcessStepData extends Record<string, unknown> {
  step: ExplorerProcessStep;
  selectedId: string;
  expanded: boolean;
  onSelect: (nodeId: string) => void;
  onToggle: (stepId: string) => void;
}

interface AuxiliaryData extends Record<string, unknown> {
  kind: AuxiliaryKind;
  eyebrow: string;
  label: string;
}

interface GraphNodeRecord {
  id: string;
  type: 'processStep' | 'auxiliary';
  width: number;
  height: number;
  data: ProcessStepData | AuxiliaryData;
  className: string;
}

interface GraphEdgeRecord {
  id: string;
  source: string;
  target: string;
  label: string;
}

const STEP_NODE_WIDTH = 340;
const COLLAPSED_BUSINESS_COUNT = 4;
const elk = new ELK();

function businessNode(id: string) {
  return explorerNodesById.get(id);
}

function stepHeight(step: ExplorerProcessStep, expanded: boolean): number {
  const visibleCount = expanded
    ? step.businessIds.length
    : Math.min(step.businessIds.length, COLLAPSED_BUSINESS_COUNT);
  const expandControlHeight = step.businessIds.length > COLLAPSED_BUSINESS_COUNT ? 34 : 0;
  return 112 + visibleCount * 48 + expandControlHeight;
}

function normalizeConditionLabel(label: string, targetProcessId?: string): string {
  const trimmed = label.trim();
  if (!trimmed || /^P\d{2}(?:・P\d{2})*$/.test(trimmed)) {
    return targetProcessId ? `${targetProcessId}へ進む場合` : '次に進む場合';
  }
  if (trimmed.endsWith('場合') || trimmed.endsWith('とき')) return trimmed;
  if (trimmed.endsWith('判断')) return `${trimmed}で進む場合`;
  return `${trimmed}の場合`;
}

function processCandidates(selectedId: string): ExplorerProcessIndex[] {
  const ids = explorerProcessIdsByBusinessId.get(selectedId) ?? [];
  return ids
    .map((id) => explorerProcessesById.get(id))
    .filter((process): process is ExplorerProcessIndex => Boolean(process))
    .sort((left, right) => left.order - right.order);
}

function selectedStepFor(
  process: ExplorerProcessIndex | undefined,
  selectedId: string,
): ExplorerProcessStep | undefined {
  return process?.steps.find((step) => step.businessIds.includes(selectedId));
}

function ProcessStepNode({ data }: NodeProps) {
  const stepData = data as ProcessStepData;
  const visibleBusinessIds = stepData.expanded
    ? stepData.step.businessIds
    : stepData.step.businessIds.slice(0, COLLAPSED_BUSINESS_COUNT);
  const hiddenCount = stepData.step.businessIds.length - visibleBusinessIds.length;

  return (
    <article className="process-step-card">
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <header>
        <span>工程 {stepData.step.order}</span>
        <strong>{stepData.step.activity}</strong>
        {stepData.step.outputs && <small>成果：{stepData.step.outputs}</small>}
      </header>
      <div className="process-step-businesses">
        {visibleBusinessIds.map((businessId) => {
          const node = businessNode(businessId);
          const selected = businessId === stepData.selectedId;
          return (
            <button
              key={businessId}
              type="button"
              className={selected ? 'is-current' : ''}
              aria-current={selected ? 'true' : undefined}
              aria-label={`${businessId} ${node?.label ?? '名称未登録'}${selected ? '、選択中' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                stepData.onSelect(businessId);
              }}
            >
              <span>{businessId}</span>
              <strong>{node?.label ?? '名称未登録'}</strong>
              {selected && <small>選択中</small>}
            </button>
          );
        })}
      </div>
      {stepData.step.businessIds.length > COLLAPSED_BUSINESS_COUNT
        && !stepData.step.businessIds.includes(stepData.selectedId) && (
        <button
          type="button"
          className="process-step-toggle"
          aria-expanded={stepData.expanded}
          onClick={(event) => {
            event.stopPropagation();
            stepData.onToggle(stepData.step.id);
          }}
        >
          {stepData.expanded ? '業務一覧を折りたたむ' : `残り${hiddenCount}業務を表示`}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </article>
  );
}

function AuxiliaryNode({ data }: NodeProps) {
  const auxiliary = data as AuxiliaryData;
  return (
    <div className={`process-auxiliary is-${auxiliary.kind}`}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <span>{auxiliary.eyebrow}</span>
      <strong>{auxiliary.label}</strong>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  processStep: ProcessStepNode,
  auxiliary: AuxiliaryNode,
};

function branchTargetId(step: ExplorerProcessStep, branch: ExplorerProcessBranch) {
  if (branch.targetStepId) return `step:${branch.targetStepId}`;
  if (branch.terminal) return 'aux:end';
  if (branch.targetProcessId) return `aux:transition:${step.id}:${branch.targetProcessId}`;
  return `aux:transition:${step.id}:unregistered`;
}

function buildProcessGraph(
  process: ExplorerProcessIndex,
  selectedId: string,
  expandedStepIds: Set<string>,
  onSelect: (nodeId: string) => void,
  onToggle: (stepId: string) => void,
): { records: GraphNodeRecord[]; edges: GraphEdgeRecord[] } {
  const records: GraphNodeRecord[] = [
    {
      id: 'aux:start',
      type: 'auxiliary',
      width: 270,
      height: 82,
      data: { kind: 'start', eyebrow: '開始', label: process.startTrigger },
      className: 'flow-map-auxiliary-node is-start',
    },
    {
      id: 'aux:end',
      type: 'auxiliary',
      width: 270,
      height: 82,
      data: { kind: 'end', eyebrow: '完了', label: process.endState },
      className: 'flow-map-auxiliary-node is-end',
    },
  ];
  const edges: GraphEdgeRecord[] = [];
  const referencedStepIds = new Set(
    process.steps.flatMap((step) => [
      ...step.nextStepIds,
      ...step.branches.flatMap((branch) => branch.targetStepId ? [branch.targetStepId] : []),
    ]),
  );
  const entrySteps = process.steps.filter((step) => !referencedStepIds.has(step.id));
  const firstSteps = entrySteps.length > 0 ? entrySteps : process.steps.slice(0, 1);

  for (const step of process.steps) {
    const expanded = expandedStepIds.has(step.id) || step.businessIds.includes(selectedId);
    records.push({
      id: `step:${step.id}`,
      type: 'processStep',
      width: STEP_NODE_WIDTH,
      height: stepHeight(step, expanded),
      data: { step, selectedId, expanded, onSelect, onToggle },
      className: `flow-map-process-step${step.businessIds.includes(selectedId) ? ' contains-selection' : ''}`,
    });
  }

  firstSteps.forEach((step, index) => {
    edges.push({
      id: `edge:start:${step.id}:${index}`,
      source: 'aux:start',
      target: `step:${step.id}`,
      label: '次に進む',
    });
  });

  for (const step of process.steps) {
    const sourceId = `step:${step.id}`;

    if (step.branches.length === 0) {
      if (step.nextStepIds.length === 0) {
        edges.push({
          id: `edge:${step.id}:end`,
          source: sourceId,
          target: 'aux:end',
          label: '次に進む',
        });
      } else {
        step.nextStepIds.forEach((targetStepId, index) => {
          edges.push({
            id: `edge:${step.id}:${targetStepId}:${index}`,
            source: sourceId,
            target: `step:${targetStepId}`,
            label: '次に進む',
          });
        });
      }
      continue;
    }

    const conditionId = `aux:condition:${step.id}`;
    records.push({
      id: conditionId,
      type: 'auxiliary',
      width: 250,
      height: 76,
      data: {
        kind: 'condition',
        eyebrow: '条件',
        label: step.connection || '次の進み方を確認する',
      },
      className: 'flow-map-auxiliary-node is-condition',
    });
    edges.push({
      id: `edge:${step.id}:condition`,
      source: sourceId,
      target: conditionId,
      label: '次に進む',
    });

    const branchStepTargets = new Set(
      step.branches.flatMap((branch) => branch.targetStepId ? [branch.targetStepId] : []),
    );
    const seenTargets = new Set<string>();

    step.branches.forEach((branch, index) => {
      const target = branchTargetId(step, branch);
      const targetKey = `${target}:${branch.label}`;
      if (seenTargets.has(targetKey)) return;
      seenTargets.add(targetKey);

      if (branch.targetProcessId) {
        const targetProcess = explorerProcessesById.get(branch.targetProcessId);
        if (!records.some((record) => record.id === target)) {
          records.push({
            id: target,
            type: 'auxiliary',
            width: 250,
            height: 82,
            data: {
              kind: 'transition',
              eyebrow: '次のプロセス',
              label: `${branch.targetProcessId} ${targetProcess?.label ?? '名称未登録'}へ`,
            },
            className: 'flow-map-auxiliary-node is-transition',
          });
          edges.push({
            id: `edge:${target}:end`,
            source: target,
            target: 'aux:end',
            label: 'このプロセスを終える',
          });
        }
      }

      edges.push({
        id: `edge:${step.id}:branch:${index}`,
        source: conditionId,
        target,
        label: normalizeConditionLabel(branch.label, branch.targetProcessId),
      });
    });

    step.nextStepIds
      .filter((targetStepId) => !branchStepTargets.has(targetStepId))
      .forEach((targetStepId, index) => {
        edges.push({
          id: `edge:${step.id}:otherwise:${index}`,
          source: conditionId,
          target: `step:${targetStepId}`,
          label: 'その他の場合',
        });
      });
  }

  return { records, edges };
}

async function layoutProcess(
  records: GraphNodeRecord[],
  graphEdges: GraphEdgeRecord[],
): Promise<{ nodes: ReactFlowNode[]; edges: ReactFlowEdge[] }> {
  const layout = await elk.layout({
    id: 'full-business-process',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '54',
      'elk.layered.spacing.nodeNodeBetweenLayers': '72',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.mergeEdges': 'true',
    },
    children: records.map((record) => ({
      id: record.id,
      width: record.width,
      height: record.height,
    })),
    edges: graphEdges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  });
  const positions = new Map(
    (layout.children ?? []).map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]),
  );

  return {
    nodes: records.map((record) => ({
      id: record.id,
      type: record.type,
      position: positions.get(record.id) ?? { x: 0, y: 0 },
      data: record.data,
      className: record.className,
      style: { width: record.width, height: record.height },
      draggable: false,
      selectable: false,
    })),
    edges: graphEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      markerEnd: { type: MarkerType.ArrowClosed },
      className: 'flow-map-edge',
    })),
  };
}

function ProcessTextAlternative({
  process,
  selectedId,
  onSelect,
}: {
  process: ExplorerProcessIndex;
  selectedId: string;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <section className="flow-map-text-alternative" aria-labelledby="process-text-title">
      <div className="process-text-heading">
        <h3 id="process-text-title">プロセス内容をテキストで確認</h3>
        <p><strong>開始：</strong>{process.startTrigger}</p>
      </div>
      <ol>
        {process.steps.map((step) => (
          <li key={step.id}>
            <div>
              <span>工程 {step.order}</span>
              <strong>{step.activity}</strong>
              {step.outputs && <small>成果：{step.outputs}</small>}
            </div>
            <ul>
              {step.businessIds.map((businessId) => {
                const node = businessNode(businessId);
                const selected = businessId === selectedId;
                return (
                  <li key={businessId}>
                    <button
                      type="button"
                      aria-current={selected ? 'true' : undefined}
                      onClick={() => onSelect(businessId)}
                    >
                      <span>{businessId}</span>
                      <strong>{node?.label ?? '名称未登録'}</strong>
                      {selected && <small>選択中</small>}
                    </button>
                  </li>
                );
              })}
            </ul>
            {step.branches.length > 0 && (
              <p className="process-text-branches">
                <strong>条件：</strong>
                {step.branches.map((branch) => normalizeConditionLabel(branch.label, branch.targetProcessId)).join('／')}
              </p>
            )}
          </li>
        ))}
      </ol>
      <p className="process-text-end"><strong>完了：</strong>{process.endState}</p>
    </section>
  );
}

export default function FlowMap({ selectedId, onSelect }: FlowMapProps) {
  const candidates = useMemo(() => processCandidates(selectedId), [selectedId]);
  const [activeProcessId, setActiveProcessId] = useState<string>();
  const [expandedStepIds, setExpandedStepIds] = useState<Set<string>>(() => new Set());
  const [nodes, setNodes] = useState<ReactFlowNode[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);
  const [state, setState] = useState<FlowMapState>('loading');
  const { fitView } = useReactFlow();
  const { coarsePointer, reducedMotion } = useExplorerMediaPreferences();

  const process = useMemo(() => {
    const maintained = candidates.find((candidate) => candidate.id === activeProcessId);
    return maintained ?? candidates[0];
  }, [activeProcessId, candidates]);
  const selectedStep = selectedStepFor(process, selectedId);

  useEffect(() => {
    if (process?.id !== activeProcessId) setActiveProcessId(process?.id);
  }, [activeProcessId, process?.id]);

  const toggleStep = useCallback((stepId: string) => {
    setExpandedStepIds((current) => {
      const next = new Set(current);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }, []);

  const showWholeProcess = useCallback(() => {
    void fitView({ padding: 0.08, duration: reducedMotion ? 0 : 240, maxZoom: 0.92 });
  }, [fitView, reducedMotion]);

  const showSelectedBusiness = useCallback(() => {
    if (!selectedStep) {
      showWholeProcess();
      return;
    }
    void fitView({
      nodes: [{ id: `step:${selectedStep.id}` }],
      padding: 0.35,
      duration: reducedMotion ? 0 : 240,
      maxZoom: 1,
    });
  }, [fitView, reducedMotion, selectedStep, showWholeProcess]);

  useEffect(() => {
    if (!process) {
      setNodes([]);
      setEdges([]);
      setState('ready');
      return;
    }

    let active = true;
    setState('loading');
    const graph = buildProcessGraph(
      process,
      selectedId,
      expandedStepIds,
      onSelect,
      toggleStep,
    );
    layoutProcess(graph.records, graph.edges)
      .then((layout) => {
        if (!active) return;
        setNodes(layout.nodes);
        setEdges(layout.edges);
        setState('ready');
        window.requestAnimationFrame(() => showSelectedBusiness());
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [expandedStepIds, onSelect, process, selectedId, showSelectedBusiness, toggleStep]);

  if (!process) {
    return (
      <div className="flow-map-empty">
        <strong>この項目を含む横断プロセスは登録されていません。</strong>
        <span>業務ID単位の業務を選択すると、開始から完了までの流れを表示します。</span>
      </div>
    );
  }

  const businessCount = new Set(process.steps.flatMap((step) => step.businessIds)).size;

  return (
    <div className="flow-map-view">
      <div className="flow-map-context">
        <div>
          <span>表示中の横断プロセス</span>
          <strong>{process.id} {process.label}</strong>
          <small>開始から完了まで・全{process.steps.length}工程</small>
        </div>
        <div className="flow-map-actions">
          <span>{businessCount}業務</span>
          <button type="button" onClick={showSelectedBusiness}>選択業務へ</button>
          <button type="button" onClick={showWholeProcess}>全体を表示</button>
        </div>
      </div>

      <div
        className="flow-map-canvas"
        aria-label={`${process.id} ${process.label}のプロセス図`}
        data-process-id={process.id}
      >
        {state === 'loading' && <div className="explorer-state">プロセス全体を配置しています…</div>}
        {state === 'error' && <div className="explorer-state is-error">プロセス図を表示できませんでした。</div>}
        {state === 'ready' && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.08, maxZoom: 0.92 }}
            minZoom={0.14}
            maxZoom={1.35}
            nodesConnectable={false}
            nodesDraggable={false}
            elementsSelectable={false}
            panOnDrag
            zoomOnScroll={!coarsePointer}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={22} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>

      <div className="flow-map-legend" aria-label="プロセス図の読み方">
        <span><i className="is-business" />業務を選択できます</span>
        <span><i className="is-condition" />条件は日本語ラベルで示します</span>
        <span><i className="is-current" />太枠と「選択中」で現在地を示します</span>
        <span><i className="is-arrow" />矢印はすべて「次に進む」です</span>
      </div>

      <ProcessTextAlternative process={process} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
}
