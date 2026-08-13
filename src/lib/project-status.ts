import type { PROJECT_STATUSES } from "@/lib/validations/project";

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" }
> = {
  PLANNING: { label: "Planificación", tone: "neutral" },
  IN_PROGRESS: { label: "En curso", tone: "accent" },
  ON_HOLD: { label: "En pausa", tone: "warning" },
  COMPLETED: { label: "Completado", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
};
