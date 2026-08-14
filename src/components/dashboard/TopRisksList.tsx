import Link from "next/link";
import { SeverityBadge } from "@/components/risks/RiskBadges";

type RiskRow = {
  id: string;
  name: string;
  severity: number;
  project: { id: string; name: string };
};

export function TopRisksList({ risks }: { risks: RiskRow[] }) {
  if (risks.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Sin riesgos activos. 🎉</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {risks.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <Link
              href={`/projects/${r.project.id}/risks`}
              className="block truncate text-sm font-medium text-foreground hover:text-accent"
            >
              {r.name}
            </Link>
            <p className="truncate text-xs text-muted">{r.project.name}</p>
          </div>
          <SeverityBadge severity={r.severity} />
        </li>
      ))}
    </ul>
  );
}
