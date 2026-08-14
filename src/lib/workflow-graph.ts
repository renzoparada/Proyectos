import { MarkerType, type Node, type Edge } from "@xyflow/react";
import type { FlowNodeData } from "@/components/workflows/nodes";
import type { WorkflowDTO } from "@/types/workflow";

export function dbToFlowNodes(
  workflow: Pick<WorkflowDTO, "nodes">,
  workflowNameById: Map<string, string>
): Node<FlowNodeData>[] {
  return workflow.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: { x: n.positionX, y: n.positionY },
    data: {
      label: n.label,
      nodeType: n.type,
      meta: n.data,
      targetWorkflowName: n.data?.targetWorkflowId
        ? workflowNameById.get(n.data.targetWorkflowId)
        : undefined,
    },
  }));
}

export function dbToFlowEdges(workflow: Pick<WorkflowDTO, "edges">): Edge[] {
  return workflow.edges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label: e.label ?? undefined,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
  }));
}

export function flowNodesToPayload(nodes: Node<FlowNodeData>[]) {
  return nodes.map((n) => ({
    clientId: n.id,
    type: n.data.nodeType,
    label: n.data.label,
    positionX: n.position.x,
    positionY: n.position.y,
    data: n.data.meta ?? null,
  }));
}

export function flowEdgesToPayload(edges: Edge[]) {
  return edges.map((e) => ({
    sourceClientId: e.source,
    targetClientId: e.target,
    label: typeof e.label === "string" ? e.label : null,
  }));
}
