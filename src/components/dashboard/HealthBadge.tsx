import { Badge } from "@/components/ui/Badge";
import { HEALTH_STATUS_META, type HealthStatus } from "@/lib/health-score";

export function HealthBadge({ status }: { status: HealthStatus }) {
  const meta = HEALTH_STATUS_META[status];
  const dot = { GREEN: "🟢", YELLOW: "🟡", RED: "🔴" }[status];
  return (
    <Badge tone={meta.tone}>
      <span aria-hidden>{dot}</span> {meta.label}
    </Badge>
  );
}
