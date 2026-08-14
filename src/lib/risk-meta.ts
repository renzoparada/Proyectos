export const RISK_CATEGORIES = [
  "TECHNICAL",
  "FINANCIAL",
  "OPERATIONAL",
  "LEGAL",
  "MARKET",
  "OTHER",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const RISK_STATUSES = [
  "IDENTIFIED",
  "MONITORING",
  "MITIGATED",
  "MATERIALIZED",
  "CLOSED",
] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export const RISK_CATEGORY_META: Record<RiskCategory, { label: string }> = {
  TECHNICAL: { label: "Técnico" },
  FINANCIAL: { label: "Financiero" },
  OPERATIONAL: { label: "Operativo" },
  LEGAL: { label: "Legal" },
  MARKET: { label: "Mercado" },
  OTHER: { label: "Otro" },
};

export const RISK_STATUS_META: Record<
  RiskStatus,
  { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" }
> = {
  IDENTIFIED: { label: "Identificado", tone: "neutral" },
  MONITORING: { label: "En monitoreo", tone: "accent" },
  MITIGATED: { label: "Mitigado", tone: "success" },
  MATERIALIZED: { label: "Materializado", tone: "danger" },
  CLOSED: { label: "Cerrado", tone: "neutral" },
};

// 1-5 scale used for both probability and impact.
export const RISK_SCALE_LABELS: Record<number, string> = {
  1: "Muy baja",
  2: "Baja",
  3: "Media",
  4: "Alta",
  5: "Muy alta",
};

export type SeverityBand = {
  label: string;
  className: string; // tailwind classes using existing design tokens
  cellClassName: string; // slightly different shade for the heatmap grid cells
};

/** Buckets a 1-25 severity score (probability × impact) into the 4 standard risk bands. */
export function severityBand(severity: number): SeverityBand {
  if (severity >= 15) {
    return {
      label: "Crítico",
      className: "bg-danger text-white border-transparent",
      cellClassName: "bg-danger text-white",
    };
  }
  if (severity >= 10) {
    return {
      label: "Alto",
      className: "bg-danger/15 text-danger border-danger/30",
      cellClassName: "bg-danger/40 text-foreground",
    };
  }
  if (severity >= 5) {
    return {
      label: "Medio",
      className: "bg-warning-bg text-warning border-warning/30",
      cellClassName: "bg-warning/40 text-foreground",
    };
  }
  return {
    label: "Bajo",
    className: "bg-success-bg text-success border-success/30",
    cellClassName: "bg-success/30 text-foreground",
  };
}
