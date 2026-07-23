import businessEdges from './generated/business-edges.json';
import businessNodes from './generated/business-nodes.json';
import lifecycleStages from './generated/lifecycle-stages.json';
import manifest from './generated/manifest.json';
import processes from './generated/processes.json';
import type {
  ExplorerEdge,
  ExplorerGraph,
  ExplorerLifecycleStage,
  ExplorerManifest,
  ExplorerNode,
  ExplorerProcessIndex,
} from './schema';

export const explorerGraph: ExplorerGraph = {
  nodes: businessNodes as ExplorerNode[],
  edges: businessEdges as ExplorerEdge[],
  lifecycleStages: lifecycleStages as ExplorerLifecycleStage[],
  processes: processes as ExplorerProcessIndex[],
  manifest: manifest as ExplorerManifest,
};

export const explorerNodesById = new Map(explorerGraph.nodes.map((node) => [node.id, node]));

export function getExplorerEdgesForNode(nodeId: string): ExplorerEdge[] {
  return explorerGraph.edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
}
