import businessEdges from './generated/business-edges.json';
import businessAreas from './generated/business-areas.json';
import businessIndex from './generated/business-index.json';
import businessNodes from './generated/business-nodes.json';
import manifest from './generated/manifest.json';
import processes from './generated/processes.json';
import type {
  ExplorerEdge,
  ExplorerGraph,
  ExplorerBusinessArea,
  ExplorerBusinessIndexEntry,
  ExplorerManifest,
  ExplorerNode,
  ExplorerProcessIndex,
} from './schema';

export const explorerGraph: ExplorerGraph = {
  nodes: businessNodes as ExplorerNode[],
  edges: businessEdges as ExplorerEdge[],
  businessAreas: businessAreas as ExplorerBusinessArea[],
  businessIndex: businessIndex as ExplorerBusinessIndexEntry[],
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

export function getExplorerEdgesForNode(nodeId: string): ExplorerEdge[] {
  return explorerGraph.edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
}
