import Link from "next/link";
import { Flag } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Milestone = {
  id: string;
  name: string;
  startDate: string | Date;
  project: { id: string; name: string };
};

export function UpcomingMilestones({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Sin hitos en los próximos 30 días.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {milestones.map((m) => (
        <li key={m.id} className="flex items-center gap-3 py-2.5">
          <Flag size={14} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <Link
              href={`/projects/${m.project.id}/tasks`}
              className="block truncate text-sm font-medium text-foreground hover:text-accent"
            >
              {m.name}
            </Link>
            <p className="truncate text-xs text-muted">{m.project.name}</p>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted">{formatDate(m.startDate)}</span>
        </li>
      ))}
    </ul>
  );
}
