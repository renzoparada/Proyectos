"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";

export function RiskTrendChart({ data }: { data: { key: string; label: string; count: number }[] }) {
  const allZero = data.every((d) => d.count === 0);
  if (allZero) {
    return <p className="py-10 text-center text-sm text-muted">Sin riesgos registrados todavía.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="riskTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => `${v} riesgo(s)`} />} />
        <Area
          type="monotone"
          dataKey="count"
          name="Riesgos creados"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#riskTrendFill)"
          dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
