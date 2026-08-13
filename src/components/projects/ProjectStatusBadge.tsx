import { Badge } from "@/components/ui/Badge";
import { PROJECT_STATUS_META, type ProjectStatus } from "@/lib/project-status";

export function ProjectStatusBadge({ status }: { status: string }) {
  const meta = PROJECT_STATUS_META[status as ProjectStatus] ?? {
    label: status,
    tone: "neutral" as const,
  };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
