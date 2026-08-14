export const WORKFLOW_NODE_TYPES = ["START", "TASK", "DECISION", "END", "SUBFLOW"] as const;
export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number];

export const WORKFLOW_NODE_META: Record<
  WorkflowNodeType,
  { label: string; description: string }
> = {
  START: { label: "Inicio", description: "Punto de partida del flujo" },
  TASK: { label: "Tarea / paso", description: "Una etapa o actividad del proceso" },
  DECISION: { label: "Decisión", description: "Ramifica el flujo (si / no)" },
  END: { label: "Fin", description: "Punto de cierre del flujo" },
  SUBFLOW: { label: "Subflujo", description: "Enlaza a otro flujo guardado" },
};

export const DEFAULT_NODE_LABEL: Record<WorkflowNodeType, string> = {
  START: "Inicio",
  TASK: "Nuevo paso",
  DECISION: "¿Decisión?",
  END: "Fin",
  SUBFLOW: "Subflujo",
};
