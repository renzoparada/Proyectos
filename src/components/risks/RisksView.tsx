"use client";

import { useMemo, useState } from "react";
import { Download, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { RiskHeatmap } from "@/components/risks/RiskHeatmap";
import { RiskListView } from "@/components/risks/RiskListView";
import { RiskForm, type RiskFormValues } from "@/components/risks/RiskForm";
import { RISK_CATEGORY_META, RISK_STATUS_META, RISK_SCALE_LABELS } from "@/lib/risk-meta";
import { canWrite, type Role } from "@/lib/permissions";
import { toCsv, downloadCsv } from "@/lib/csv";
import type { RiskDTO } from "@/types/risk";
import type { UserOptionDTO } from "@/types/task";

function toPayload(values: RiskFormValues) {
  return {
    name: values.name,
    description: values.description,
    category: values.category,
    probability: values.probability,
    impact: values.impact,
    status: values.status,
    mitigationPlan: values.mitigationPlan,
    ownerId: values.ownerId,
  };
}

export function RisksView({
  projectId,
  initialRisks,
  users,
  currentRole,
}: {
  projectId: string;
  initialRisks: RiskDTO[];
  users: UserOptionDTO[];
  currentRole: Role;
}) {
  const readOnly = !canWrite(currentRole);
  const [risks, setRisks] = useState(initialRisks);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCell, setSelectedCell] = useState<{ probability: number; impact: number } | null>(
    null
  );
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; risk: RiskDTO } | null>(
    null
  );
  const [pendingDelete, setPendingDelete] = useState<RiskDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const baseFiltered = useMemo(() => {
    return risks.filter((r) => {
      if (categoryFilter !== "ALL" && r.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      return true;
    });
  }, [risks, categoryFilter, statusFilter]);

  const listFiltered = useMemo(() => {
    if (!selectedCell) return baseFiltered;
    return baseFiltered.filter(
      (r) => r.probability === selectedCell.probability && r.impact === selectedCell.impact
    );
  }, [baseFiltered, selectedCell]);

  async function refetch() {
    const res = await fetch(`/api/projects/${projectId}/risks`);
    if (res.ok) setRisks((await res.json()).risks);
  }

  async function handleCreate(values: RiskFormValues) {
    const res = await fetch(`/api/projects/${projectId}/risks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(values)),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo crear el riesgo";
    setModal(null);
    await refetch();
  }

  async function handleEdit(risk: RiskDTO, values: RiskFormValues) {
    const res = await fetch(`/api/risks/${risk.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(values)),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo actualizar el riesgo";
    setModal(null);
    await refetch();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/risks/${pendingDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setPendingDelete(null);
        await refetch();
      }
    } finally {
      setDeleting(false);
    }
  }

  const highSeverityCount = risks.filter((r) => r.severity >= 10).length;

  function handleExport() {
    const csv = toCsv(listFiltered, [
      { header: "Nombre", value: (r) => r.name },
      { header: "Categoría", value: (r) => RISK_CATEGORY_META[r.category].label },
      { header: "Probabilidad", value: (r) => RISK_SCALE_LABELS[r.probability] },
      { header: "Impacto", value: (r) => RISK_SCALE_LABELS[r.impact] },
      { header: "Severidad", value: (r) => r.severity },
      { header: "Estado", value: (r) => RISK_STATUS_META[r.status].label },
      { header: "Responsable", value: (r) => r.owner?.name },
      { header: "Plan de mitigación", value: (r) => r.mitigationPlan },
    ]);
    downloadCsv(`riesgos-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-muted">
          {risks.length} riesgo(s)
          {highSeverityCount > 0 && (
            <span className="ml-1 text-danger">· {highSeverityCount} de severidad alta o crítica</span>
          )}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} />
            Exportar CSV
          </Button>
          {!readOnly && (
            <Button onClick={() => setModal({ mode: "create" })}>
              <Plus size={16} />
              Nuevo riesgo
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-auto">
          <option value="ALL">Todas las categorías</option>
          {Object.entries(RISK_CATEGORY_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="ALL">Todos los estados</option>
          {Object.entries(RISK_STATUS_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
        {selectedCell && (
          <button
            onClick={() => setSelectedCell(null)}
            className="flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-foreground hover:bg-surface-hover"
          >
            Prob. {RISK_SCALE_LABELS[selectedCell.probability]} × Impacto{" "}
            {RISK_SCALE_LABELS[selectedCell.impact]}
            <X size={12} />
          </button>
        )}
      </div>

      <div className="mb-4">
        <RiskHeatmap risks={baseFiltered} selected={selectedCell} onSelectCell={setSelectedCell} />
      </div>

      <RiskListView
        risks={listFiltered}
        onEdit={readOnly ? undefined : (risk) => setModal({ mode: "edit", risk })}
        onDelete={readOnly ? undefined : (risk) => setPendingDelete(risk)}
      />

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Editar riesgo" : "Nuevo riesgo"}
      >
        <RiskForm
          risk={modal?.mode === "edit" ? modal.risk : null}
          users={users}
          onCancel={() => setModal(null)}
          submitLabel={modal?.mode === "edit" ? "Guardar cambios" : "Crear riesgo"}
          onSubmit={(values) =>
            modal?.mode === "edit" ? handleEdit(modal.risk, values) : handleCreate(values)
          }
        />
        {modal?.mode === "edit" && (
          <div className="mt-3 flex justify-end border-t border-border pt-3">
            <button
              onClick={() => {
                setPendingDelete(modal.risk);
                setModal(null);
              }}
              className="text-xs font-medium text-danger hover:underline"
            >
              Eliminar riesgo
            </button>
          </div>
        )}
      </Modal>

      <Modal open={pendingDelete !== null} onClose={() => setPendingDelete(null)} title="Eliminar riesgo">
        <p className="text-sm text-foreground">
          ¿Seguro que quieres eliminar <strong>{pendingDelete?.name}</strong>? No se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Eliminando…" : "Eliminar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
