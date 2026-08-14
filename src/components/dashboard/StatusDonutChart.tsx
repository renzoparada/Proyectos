"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { TONE_COLOR } from "@/components/dashboard/chart-colors";
import { PROJECT_STATUS_META, type ProjectStatus } from "@/lib/project-status";
import { PROJECT_STATUSES } from "@/lib/validations/project";

export function StatusDonutChart({ counts }: { counts: Record<string, number> }) {
  const total = PROJECT_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  const data = PROJECT_STATUSES.map((status) => ({
    status,
    label: PROJECT_STATUS_META[status as ProjectStatus].label,
    value: counts[status] ?? 0,
    color: TONE_COLOR[PROJECT_STATUS_META[status as ProjectStatus].tone],
  })).filter((d) => d.value > 0);

  if (total === 0) {
    return <p className="py-10 text-center text-sm text-muted">Todavía no hay proyectos.</p>;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              cornerRadius={3}
              stroke="var(--surface)"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.status} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-foreground">{total}</span>
          <span className="text-[11px] text-muted">proyectos</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-1.5">
        {data.map((d) => (
          <li key={d.status} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-foreground">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
              {d.label}
            </span>
            <span className="font-medium text-muted">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
