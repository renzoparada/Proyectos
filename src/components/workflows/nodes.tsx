"use client";

import { memo } from "react";
import Link from "next/link";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ExternalLink, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeType } from "@/lib/workflow-meta";

export type FlowNodeData = {
  label: string;
  nodeType: WorkflowNodeType;
  meta?: { targetWorkflowId?: string } | null;
  targetWorkflowName?: string;
};

const handleClass = "!h-2.5 !w-2.5 !border-2 !border-surface !bg-accent";

export const StartNode = memo(({ data, selected }: NodeProps & { data: FlowNodeData }) => (
  <div
    className={cn(
      "flex min-w-32 items-center justify-center rounded-full border-2 border-success bg-success-bg px-4 py-2.5 text-sm font-medium text-success shadow-sm",
      selected && "ring-2 ring-offset-2 ring-offset-background ring-success"
    )}
  >
    {data.label}
    <Handle type="source" position={Position.Right} className={handleClass} />
  </div>
));
StartNode.displayName = "StartNode";

export const EndNode = memo(({ data, selected }: NodeProps & { data: FlowNodeData }) => (
  <div
    className={cn(
      "flex min-w-32 items-center justify-center rounded-full border-2 border-danger bg-danger-bg px-4 py-2.5 text-sm font-medium text-danger shadow-sm",
      selected && "ring-2 ring-offset-2 ring-offset-background ring-danger"
    )}
  >
    <Handle type="target" position={Position.Left} className={handleClass} />
    {data.label}
  </div>
));
EndNode.displayName = "EndNode";

export const TaskNode = memo(({ data, selected }: NodeProps & { data: FlowNodeData }) => (
  <div
    className={cn(
      "min-w-40 rounded-md border border-accent/30 bg-surface px-4 py-2.5 text-sm font-medium text-foreground shadow-sm",
      selected && "ring-2 ring-offset-2 ring-offset-background ring-accent"
    )}
  >
    <Handle type="target" position={Position.Left} className={handleClass} />
    {data.label}
    <Handle type="source" position={Position.Right} className={handleClass} />
  </div>
));
TaskNode.displayName = "TaskNode";

export const DecisionNode = memo(({ data, selected }: NodeProps & { data: FlowNodeData }) => (
  <div
    className={cn(
      "flex min-w-40 items-center gap-1.5 rounded-md border border-warning/40 bg-warning-bg px-4 py-2.5 text-sm font-medium text-foreground shadow-sm",
      selected && "ring-2 ring-offset-2 ring-offset-background ring-warning"
    )}
  >
    <Handle type="target" position={Position.Left} className={handleClass} />
    <GitBranch size={14} className="shrink-0 text-warning" />
    {data.label}
    <Handle type="source" position={Position.Right} id="yes" className={handleClass} style={{ top: "35%" }} />
    <Handle type="source" position={Position.Bottom} id="no" className={handleClass} />
  </div>
));
DecisionNode.displayName = "DecisionNode";

export const SubflowNode = memo(({ data, selected }: NodeProps & { data: FlowNodeData }) => (
  <div
    className={cn(
      "min-w-44 rounded-md border border-accent/40 border-dashed bg-accent/10 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm",
      selected && "ring-2 ring-offset-2 ring-offset-background ring-accent"
    )}
  >
    <Handle type="target" position={Position.Left} className={handleClass} />
    <div className="flex items-center justify-between gap-2">
      <span>{data.label}</span>
      {data.meta?.targetWorkflowId && (
        <Link
          href={`/workflows/${data.meta.targetWorkflowId}`}
          onClick={(e) => e.stopPropagation()}
          title={`Ir a ${data.targetWorkflowName ?? "flujo enlazado"}`}
          className="shrink-0 text-accent hover:text-accent-hover"
        >
          <ExternalLink size={13} />
        </Link>
      )}
    </div>
    {data.targetWorkflowName && (
      <p className="mt-0.5 truncate text-xs font-normal text-muted">→ {data.targetWorkflowName}</p>
    )}
    <Handle type="source" position={Position.Right} className={handleClass} />
  </div>
));
SubflowNode.displayName = "SubflowNode";

export const WORKFLOW_NODE_TYPES_MAP = {
  START: StartNode,
  TASK: TaskNode,
  DECISION: DecisionNode,
  END: EndNode,
  SUBFLOW: SubflowNode,
};
