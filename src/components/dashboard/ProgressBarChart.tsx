"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList } from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import type { ProjectHealth } from "@/lib/dashboard-data";

export function ProgressBarChart({ projects }: { projects: ProjectHealth[] }) {
  const data = [...projects]
    .filter((p) => p.avgProgress !== null)
    .sort((a, b) => (a.avgProgress ?? 0) - (b.avgProgress ?? 0))
    .slice(0, 8)
    .map((p) => ({ name: p.name, progress: Math.round(p.avgProgress ?? 0) }));

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">Todavía no hay tareas con avance.</p>;
  }

  const height = Math.max(140, data.length * 34);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          unit="%"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: "var(--foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: "var(--surface-hover)" }} content={<ChartTooltip formatter={(v) => `${v}%`} />} />
        <Bar dataKey="progress" name="Avance" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={18}>
          <LabelList
            dataKey="progress"
            position="right"
            formatter={(v: React.ReactNode) => (v === undefined || v === null ? "" : `${v}%`)}
            style={{ fill: "var(--muted)", fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
