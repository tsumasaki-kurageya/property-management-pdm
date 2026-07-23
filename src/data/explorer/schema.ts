export const explorerNodeTypes = [
  'area',
  'business',
  'procedure',
  'artifact',
  'role',
  'standard',
  'lifecycle',
  'process',
] as const;

export const explorerEdgeTypes = [
  'contains',
  'precedes',
  'branches_to',
  'uses',
  'produces',
  'performed_by',
  'approved_by',
  'governed_by',
  'participates_in',
  'related_to',
] as const;

export type ExplorerNodeType = (typeof explorerNodeTypes)[number];
export type ExplorerEdgeType = (typeof explorerEdgeTypes)[number];

export interface ExplorerSourceReference {
  path: string;
  anchor?: string;
}

export interface ExplorerNode {
  id: string;
  type: ExplorerNodeType;
  label: string;
  description?: string;
  href?: string;
  source: ExplorerSourceReference;
  metadata?: Record<string, unknown>;
}

export interface ExplorerEdge {
  id: string;
  type: ExplorerEdgeType;
  from: string;
  to: string;
  label?: string;
  source: ExplorerSourceReference;
  metadata?: Record<string, unknown>;
}

export interface ExplorerLifecycleStage {
  id: string;
  label: string;
  description: string;
  processIds: string[];
}

export interface ExplorerProcessIndex {
  id: string;
  label: string;
  lifecycleId: string;
  businessIds: string[];
}

export interface ExplorerManifest {
  schemaVersion: string;
  catalogVersion: string;
  counts: Record<ExplorerNodeType | 'edges', number>;
  sourceHashes: Record<string, string>;
}

export interface ExplorerGraph {
  nodes: ExplorerNode[];
  edges: ExplorerEdge[];
  lifecycleStages: ExplorerLifecycleStage[];
  processes: ExplorerProcessIndex[];
  manifest: ExplorerManifest;
}
