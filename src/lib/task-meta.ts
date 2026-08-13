export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" }
> = {
  TODO: { label: "Por hacer", tone: "neutral" },
  IN_PROGRESS: { label: "En curso", tone: "accent" },
  DONE: { label: "Hecho", tone: "success" },
  BLOCKED: { label: "Bloqueada", tone: "danger" },
};

export const TASK_PRIORITY_META: Record<
  TaskPriority,
  { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" }
> = {
  LOW: { label: "Baja", tone: "neutral" },
  MEDIUM: { label: "Media", tone: "accent" },
  HIGH: { label: "Alta", tone: "warning" },
  URGENT: { label: "Urgente", tone: "danger" },
};

// Kanban column order — distinct from the enum declaration order so blocked
// tasks sit next to in-progress instead of at the end.
export const KANBAN_COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
