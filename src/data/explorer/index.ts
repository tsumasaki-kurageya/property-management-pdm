import businessEdges from './generated/business-edges.json';
import businessAreas from './generated/business-areas.json';
import businessIndex from './generated/business-index.json';
import businessNodes from './generated/business-nodes.json';
import flowScenarios from './generated/flow-scenarios.json';
import lifecycleStages from './generated/lifecycle-stages.json';
import manifest from './generated/manifest.json';
import processes from './generated/processes.json';
import type {
  ExplorerEdge,
  ExplorerGraph,
  ExplorerBusinessArea,
  ExplorerBusinessIndexEntry,
  ExplorerLifecycleStage,
  ExplorerManifest,
  ExplorerNode,
  ExplorerProcessIndex,
  ExplorerSourceReference,
} from './schema';

interface ExplorerFlowScenario {
  selectedId: string;
  previousId: string;
  normalNextId: string;
  abnormalNextId: string;
  source: ExplorerSourceReference;
}

export const explorerGraph: ExplorerGraph = {
  nodes: businessNodes as ExplorerNode[],
  edges: businessEdges as ExplorerEdge[],
  businessAreas: businessAreas as ExplorerBusinessArea[],
  businessIndex: businessIndex as ExplorerBusinessIndexEntry[],
  lifecycleStages: lifecycleStages as ExplorerLifecycleStage[],
  processes: processes as ExplorerProcessIndex[],
  manifest: manifest as ExplorerManifest,
};

export const explorerNodesById = new Map(explorerGraph.nodes.map((node) => [node.id, node]));
export const explorerAreasById = new Map(explorerGraph.businessAreas.map((area) => [area.id, area]));
export const explorerBusinessIndexById = new Map(
  explorerGraph.businessIndex.map((entry) => [entry.businessId, entry]),
);
export const explorerAreaIdByBusinessId = new Map(
  explorerGraph.businessIndex.map((entry) => [entry.businessId, entry.areaId]),
);
export const explorerProcessesById = new Map(
  explorerGraph.processes.map((process) => [process.id, process]),
);
export const explorerProcessIdsByBusinessId = new Map(
  explorerGraph.businessIndex.map((entry) => [entry.businessId, entry.processIds]),
);

const flowScenarioEdges = new Map<string, ExplorerEdge[]>();
for (const scenario of flowScenarios as ExplorerFlowScenario[]) {
  const referencedIds = [
    scenario.selectedId,
    scenario.previousId,
    scenario.normalNextId,
    scenario.abnormalNextId,
  ];
  for (const id of referencedIds) {
    if (!explorerNodesById.has(id)) throw new Error(`代表フローが存在しない業務を参照しています: ${id}`);
  }

  flowScenarioEdges.set(scenario.selectedId, [
    {
      id: `FLOW-${scenario.selectedId}-PREVIOUS`,
      type: 'precedes',
      from: scenario.previousId,
      to: scenario.selectedId,
      label: '前工程',
      source: scenario.source,
      metadata: { basis: 'flow-scenario', scenario: 'previous' },
    },
    {
      id: `FLOW-${scenario.selectedId}-NORMAL`,
      type: 'precedes',
      from: scenario.selectedId,
      to: scenario.normalNextId,
      label: '通常後続',
      source: scenario.source,
      metadata: { basis: 'flow-scenario', scenario: 'normal' },
    },
    {
      id: `FLOW-${scenario.selectedId}-ABNORMAL`,
      type: 'branches_to',
      from: scenario.selectedId,
      to: scenario.abnormalNextId,
      label: '異常時後続',
      source: scenario.source,
      metadata: { basis: 'flow-scenario', scenario: 'abnormal' },
    },
  ]);
}

export function getExplorerEdgesForNode(nodeId: string): ExplorerEdge[] {
  const connected = explorerGraph.edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
  const scenario = flowScenarioEdges.get(nodeId);
  if (!scenario) return connected;

  const nonFlowRelations = connected.filter(
    (edge) => edge.type !== 'precedes' && edge.type !== 'branches_to',
  );
  return [...scenario, ...nonFlowRelations];
}
