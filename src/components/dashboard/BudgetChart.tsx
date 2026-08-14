"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { formatBudget } from "@/lib/utils";

export function BudgetChart({
  projects,
}: {
  projects: { id: string; name: string; budgetPlanned: number | null; budgetSpent: number | null }[];
}) {
  if (projects.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        Ningún proyecto tiene presupuesto planeado o gastado cargado todavía.
      </p>
    );
  }

  const data = projects.map((p) => ({
    name: p.name,
    planeado: p.budgetPlanned ?? 0,
    gastado: p.budgetSpent ?? 0,
  }));
  const height = Math.max(160, data.length * 44);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          type="number"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          tickFormatter={(v) => formatBudget(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: "var(--foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: "var(--surface-hover)" }} content={<ChartTooltip formatter={(v) => formatBudget(Number(v))} />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--muted)" }}
          formatter={(value) => <span style={{ color: "var(--foreground)" }}>{value}</span>}
        />
        <Bar dataKey="planeado" name="Planeado" fill="var(--muted)" radius={[0, 4, 4, 0]} maxBarSize={12} />
        <Bar dataKey="gastado" name="Gastado" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}
