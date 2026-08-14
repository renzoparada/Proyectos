import type { WorkflowNodeType } from "@/lib/workflow-meta";

export type WorkflowNodeDTO = {
  id: string;
  type: WorkflowNodeType;
  label: string;
  positionX: number;
  positionY: number;
  data: { targetWorkflowId?: string } | null;
};

export type WorkflowEdgeDTO = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string | null;
};

export type WorkflowSummaryDTO = {
  id: string;
  name: string;
  version: number;
  isTemplate: boolean;
  projectId: string | null;
  project?: { id: string; name: string } | null;
  nodeCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowDTO = WorkflowSummaryDTO & {
  nodes: WorkflowNodeDTO[];
  edges: WorkflowEdgeDTO[];
};
