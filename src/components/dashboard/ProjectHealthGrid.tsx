import Link from "next/link";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import type { ProjectHealth } from "@/lib/dashboard-data";

export function ProjectHealthGrid({ projects }: { projects: ProjectHealth[] }) {
  if (projects.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No hay proyectos activos.</p>;
  }

  const sorted = [...projects].sort((a, b) => a.health.score - b.health.score);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((p) => (
        <Link
          key={p.id}
          href={`/projects/${p.id}`}
          className="flex flex-col gap-2 rounded-md border border-border bg-background p-3 transition-colors hover:border-accent/40"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-foreground">{p.name}</span>
            <HealthBadge status={p.health.status} />
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.round(p.avgProgress ?? 0)}%` }}
            />
          </div>
          <p className="text-xs text-muted">{p.health.reasons.join(" · ")}</p>
        </Link>
      ))}
    </div>
  );
}
