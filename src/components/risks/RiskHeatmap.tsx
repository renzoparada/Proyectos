"use client";

import { cn } from "@/lib/utils";
import { RISK_SCALE_LABELS, severityBand } from "@/lib/risk-meta";
import type { RiskDTO } from "@/types/risk";

const PROBABILITY_ROWS = [5, 4, 3, 2, 1];
const IMPACT_COLS = [1, 2, 3, 4, 5];

export function RiskHeatmap({
  risks,
  selected,
  onSelectCell,
}: {
  risks: RiskDTO[];
  selected: { probability: number; impact: number } | null;
  onSelectCell: (cell: { probability: number; impact: number } | null) => void;
}) {
  function countFor(probability: number, impact: number) {
    return risks.filter((r) => r.probability === probability && r.impact === impact).length;
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex gap-2">
        <div className="flex w-6 shrink-0 items-center justify-center">
          <span className="-rotate-90 whitespace-nowrap text-xs font-medium text-muted">
            Probabilidad
          </span>
        </div>
        <div className="flex-1">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `auto repeat(${IMPACT_COLS.length}, minmax(0, 1fr))` }}
          >
            {PROBABILITY_ROWS.map((prob) => (
              <div key={prob} className="contents">
                <div className="flex w-16 items-center justify-end pr-2 text-[11px] text-muted">
                  {RISK_SCALE_LABELS[prob]}
                </div>
                {IMPACT_COLS.map((impact) => {
                  const severity = prob * impact;
                  const band = severityBand(severity);
                  const count = countFor(prob, impact);
                  const isSelected = selected?.probability === prob && selected?.impact === impact;
                  return (
                    <button
                      key={impact}
                      type="button"
                      onClick={() =>
                        onSelectCell(isSelected ? null : { probability: prob, impact })
                      }
                      className={cn(
                        "flex aspect-square min-h-11 flex-col items-center justify-center rounded-md text-sm font-semibold transition-transform",
                        band.cellClassName,
                        count === 0 && "opacity-40",
                        isSelected && "ring-2 ring-offset-2 ring-offset-surface ring-foreground scale-[1.04]"
                      )}
                      title={`Probabilidad ${RISK_SCALE_LABELS[prob]} × Impacto ${RISK_SCALE_LABELS[impact]} — severidad ${severity}`}
                    >
                      {count > 0 ? count : ""}
                    </button>
                  );
                })}
              </div>
            ))}
            <div />
            {IMPACT_COLS.map((impact) => (
              <div key={impact} className="pt-1 text-center text-[11px] text-muted">
                {RISK_SCALE_LABELS[impact]}
              </div>
            ))}
          </div>
          <p className="mt-1 text-center text-xs font-medium text-muted">Impacto</p>
        </div>
      </div>
    </div>
  );
}
