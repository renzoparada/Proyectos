"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { RiskHeatmap } from "@/components/risks/RiskHeatmap";
import { RiskListView } from "@/components/risks/RiskListView";
import { RiskForm, type RiskFormValues } from "@/components/risks/RiskForm";
import { RISK_CATEGORY_META, RISK_STATUS_META, RISK_SCALE_LABELS } from "@/lib/risk-meta";
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

export function RisksConsolidatedView({
  initialRisks,
  users,
  projects,
}: {
  initialRisks: RiskDTO[];
  users: UserOptionDTO[];
  projects: { id: string; name: string }[];
}) {
  const [risks, setRisks] = useState(initialRisks);
  const [projectFilter, setProjectFilter] = useState("ALL");
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
      if (projectFilter !== "ALL" && r.projectId !== projectFilter) return false;
      if (categoryFilter !== "ALL" && r.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      return true;
    });
  }, [risks, projectFilter, categoryFilter, statusFilter]);

  const listFiltered = useMemo(() => {
    if (!selectedCell) return baseFiltered;
    return baseFiltered.filter(
      (r) => r.probability === selectedCell.probability && r.impact === selectedCell.impact
    );
  }, [baseFiltered, selectedCell]);

  async function refetch() {
    const res = await fetch("/api/risks");
    if (res.ok) setRisks((await res.json()).risks);
  }

  async function handleCreate(values: RiskFormValues) {
    const res = await fetch(`/api/projects/${values.projectId}/risks`, {
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
  const criticalCount = risks.filter((r) => r.severity >= 15).length;

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-3">
          <p className="text-xs font-medium text-muted">Riesgos totales</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{risks.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs font-medium text-muted">Severidad alta+</p>
          <p className="mt-1 text-2xl font-semibold text-danger">{highSeverityCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs font-medium text-muted">Críticos</p>
          <p className="mt-1 text-2xl font-semibold text-danger">{criticalCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs font-medium text-muted">Proyectos con riesgos</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {new Set(risks.map((r) => r.projectId)).size}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-auto">
            <option value="ALL">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
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
        <Button onClick={() => setModal({ mode: "create" })} disabled={projects.length === 0}>
          <Plus size={16} />
          Nuevo riesgo
        </Button>
      </div>

      <div className="mb-4">
        <RiskHeatmap risks={baseFiltered} selected={selectedCell} onSelectCell={setSelectedCell} />
      </div>

      <RiskListView
        risks={listFiltered}
        showProject
        onEdit={(risk) => setModal({ mode: "edit", risk })}
        onDelete={(risk) => setPendingDelete(risk)}
      />

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Editar riesgo" : "Nuevo riesgo"}
      >
        <RiskForm
          risk={modal?.mode === "edit" ? modal.risk : null}
          users={users}
          projects={modal?.mode === "create" ? projects : undefined}
          defaultProjectId={projectFilter !== "ALL" ? projectFilter : undefined}
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
