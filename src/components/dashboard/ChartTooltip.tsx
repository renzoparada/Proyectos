"use client";

// Shared tooltip content for all Recharts charts on the dashboard, styled
// with the app's own tokens instead of Recharts' default inline styles.
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number | string; color?: string }[];
  formatter?: (value: number | string, name?: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-md">
      {label !== undefined && <p className="mb-1 font-medium text-foreground">{label}</p>}
      <div className="flex flex-col gap-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            {p.color && (
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
            )}
            {p.name && <span className="text-muted">{p.name}</span>}
            <span className="font-medium text-foreground">
              {p.value !== undefined ? (formatter ? formatter(p.value, p.name) : p.value) : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
