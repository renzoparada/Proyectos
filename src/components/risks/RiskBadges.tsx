import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  RISK_CATEGORY_META,
  RISK_STATUS_META,
  severityBand,
  type RiskCategory,
  type RiskStatus,
} from "@/lib/risk-meta";

export function RiskStatusBadge({ status }: { status: string }) {
  const meta = RISK_STATUS_META[status as RiskStatus] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function RiskCategoryBadge({ category }: { category: string }) {
  const meta = RISK_CATEGORY_META[category as RiskCategory] ?? { label: category };
  return <Badge tone="neutral">{meta.label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: number }) {
  const band = severityBand(severity);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        band.className
      )}
    >
      {band.label} · {severity}
    </span>
  );
}
