// Pure, dependency-free health score calculation so it's easy to reason about
// and unit-test independently of how the numbers were fetched.

export type HealthStatus = "GREEN" | "YELLOW" | "RED";

export const HEALTH_STATUS_META: Record<
  HealthStatus,
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  GREEN: { label: "Saludable", tone: "success" },
  YELLOW: { label: "En riesgo", tone: "warning" },
  RED: { label: "Crítico", tone: "danger" },
};

export type HealthInput = {
  /** Average % progress across the project's tasks, 0-100. Null if it has no tasks yet. */
  avgProgress: number | null;
  /** % of the project's planned duration that has elapsed, 0-100. Null if it has no start/end date. */
  timeElapsedPct: number | null;
  overdueTasks: number;
  highSeverityOpenRisks: number;
};

export type HealthResult = {
  status: HealthStatus;
  score: number;
  reasons: string[];
};

/**
 * Score starts at 100 and loses points for the three signals the spec calls
 * out: schedule slip (progress vs. time elapsed), overdue tasks, and open
 * high-severity risks. Bands: >=75 green, >=50 yellow, else red.
 */
export function computeHealthScore(input: HealthInput): HealthResult {
  let score = 100;
  const reasons: string[] = [];

  if (input.overdueTasks > 0) {
    score -= Math.min(35, input.overdueTasks * 8);
    reasons.push(`${input.overdueTasks} tarea${input.overdueTasks === 1 ? "" : "s"} vencida${input.overdueTasks === 1 ? "" : "s"}`);
  }

  if (input.highSeverityOpenRisks > 0) {
    score -= Math.min(35, input.highSeverityOpenRisks * 12);
    reasons.push(
      `${input.highSeverityOpenRisks} riesgo${input.highSeverityOpenRisks === 1 ? "" : "s"} de severidad alta+`
    );
  }

  if (input.avgProgress !== null && input.timeElapsedPct !== null) {
    const gap = input.timeElapsedPct - input.avgProgress;
    if (gap > 15) {
      score -= Math.min(30, gap);
      reasons.push(
        `Avance (${Math.round(input.avgProgress)}%) por debajo del tiempo transcurrido (${Math.round(input.timeElapsedPct)}%)`
      );
    }
  }

  score = Math.max(0, Math.round(score));
  const status: HealthStatus = score >= 75 ? "GREEN" : score >= 50 ? "YELLOW" : "RED";
  if (reasons.length === 0) reasons.push("Sin señales de riesgo");

  return { status, score, reasons };
}
