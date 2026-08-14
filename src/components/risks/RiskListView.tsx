"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { RiskStatusBadge, RiskCategoryBadge, SeverityBadge } from "@/components/risks/RiskBadges";
import { RISK_SCALE_LABELS } from "@/lib/risk-meta";
import type { RiskDTO } from "@/types/risk";

export function RiskListView({
  risks,
  showProject = false,
  onEdit,
  onDelete,
}: {
  risks: RiskDTO[];
  showProject?: boolean;
  onEdit?: (risk: RiskDTO) => void;
  onDelete?: (risk: RiskDTO) => void;
}) {
  if (risks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface py-16 text-center">
        <p className="text-sm font-medium text-foreground">No hay riesgos todavía</p>
        <p className="text-sm text-muted">Registra el primer riesgo para verlo aquí.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface scrollbar-thin">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted">
            <th className="px-4 py-2.5">Riesgo</th>
            {showProject && <th className="px-4 py-2.5">Proyecto</th>}
            <th className="px-4 py-2.5">Categoría</th>
            <th className="px-4 py-2.5">Prob. × Impacto</th>
            <th className="px-4 py-2.5">Severidad</th>
            <th className="px-4 py-2.5">Estado</th>
            <th className="px-4 py-2.5">Responsable</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {risks.map((risk) => (
            <tr key={risk.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
              <td className="px-4 py-2.5">
                {onEdit ? (
                  <button
                    onClick={() => onEdit(risk)}
                    className="text-left font-medium text-foreground hover:text-accent"
                  >
                    {risk.name}
                  </button>
                ) : (
                  <span className="font-medium text-foreground">{risk.name}</span>
                )}
              </td>
              {showProject && (
                <td className="px-4 py-2.5">
                  {risk.project ? (
                    <Link
                      href={`/projects/${risk.project.id}/risks`}
                      className="text-muted hover:text-accent hover:underline"
                    >
                      {risk.project.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              )}
              <td className="px-4 py-2.5">
                <RiskCategoryBadge category={risk.category} />
              </td>
              <td className="px-4 py-2.5 text-foreground">
                {RISK_SCALE_LABELS[risk.probability]} × {RISK_SCALE_LABELS[risk.impact]}
              </td>
              <td className="px-4 py-2.5">
                <SeverityBadge severity={risk.severity} />
              </td>
              <td className="px-4 py-2.5">
                <RiskStatusBadge status={risk.status} />
              </td>
              <td className="px-4 py-2.5 text-foreground">{risk.owner?.name ?? "—"}</td>
              <td className="px-4 py-2.5">
                {(onEdit || onDelete) && (
                  <div className="flex justify-end gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(risk)}
                        className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
                        aria-label="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(risk)}
                        className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-danger"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
