import { Badge } from "@/components/ui/Badge";
import { TASK_STATUS_META, TASK_PRIORITY_META, type TaskStatus, type TaskPriority } from "@/lib/task-meta";

export function TaskStatusBadge({ status }: { status: string }) {
  const meta = TASK_STATUS_META[status as TaskStatus] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const meta = TASK_PRIORITY_META[priority as TaskPriority] ?? {
    label: priority,
    tone: "neutral" as const,
  };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
