export const explorerNodeTypes = [
  'area',
  'business',
  'procedure',
  'artifact',
  'role',
  'standard',
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

export interface ExplorerBusinessMetadata extends Record<string, unknown> {
  areaId?: string;
  catalogOrder?: number;
  startTrigger?: string;
  completionCondition?: string;
  primaryActivity?: string;
  decisionAndException?: string;
  actorAndDecisionMaker?: string;
  relatedBusinessExpression?: string;
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

export interface ExplorerBusinessArea {
  id: string;
  label: string;
  order: number;
  businessIds: string[];
}

export interface ExplorerProcessBranch {
  label: string;
  targetStepId?: string;
  targetProcessId?: string;
  terminal?: boolean;
}

export interface ExplorerProcessStep {
  id: string;
  order: string;
  businessIds: string[];
  activity: string;
  outputs: string;
  connection: string;
  nextStepIds: string[];
  branches: ExplorerProcessBranch[];
  source: ExplorerSourceReference;
}

export interface ExplorerProcessIndex {
  id: string;
  label: string;
  order: number;
  description: string;
  startTrigger: string;
  endState: string;
  entryBusinessIds: string[];
  exitBusinessIds: string[];
  businessIds: string[];
  steps: ExplorerProcessStep[];
  source: ExplorerSourceReference;
}

export interface ExplorerBusinessIndexEntry {
  businessId: string;
  areaId: string;
  processIds: string[];
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
  businessAreas: ExplorerBusinessArea[];
  businessIndex: ExplorerBusinessIndexEntry[];
  processes: ExplorerProcessIndex[];
  manifest: ExplorerManifest;
}
