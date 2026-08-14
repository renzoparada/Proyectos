import { z } from "zod";
import { WORKFLOW_NODE_TYPES } from "@/lib/workflow-meta";

const optionalId = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

export const workflowMetaSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  isTemplate: z.boolean().default(false),
  projectId: optionalId,
});
export type WorkflowMetaInput = z.infer<typeof workflowMetaSchema>;

const nodeDataSchema = z
  .object({
    targetWorkflowId: z.string().optional(),
  })
  .partial()
  .nullable()
  .optional();

export const workflowNodeSchema = z.object({
  clientId: z.string().min(1),
  type: z.enum(WORKFLOW_NODE_TYPES),
  label: z.string().trim().min(1).max(200),
  positionX: z.number(),
  positionY: z.number(),
  data: nodeDataSchema,
});

export const workflowEdgeSchema = z.object({
  sourceClientId: z.string().min(1),
  targetClientId: z.string().min(1),
  label: z
    .string()
    .trim()
    .max(60)
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional(),
});

export const workflowGraphSchema = z.object({
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
});
export type WorkflowGraphInput = z.infer<typeof workflowGraphSchema>;
