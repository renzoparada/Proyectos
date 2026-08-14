"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, LayoutTemplate, Plus, Trash2, Workflow as WorkflowIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { WorkflowMetaForm, type WorkflowMetaFormValues } from "@/components/workflows/WorkflowMetaForm";
import { formatDate } from "@/lib/utils";
import { canWrite, type Role } from "@/lib/permissions";
import type { WorkflowSummaryDTO } from "@/types/workflow";

export function WorkflowsView({
  initialWorkflows,
  projects,
  fixedProjectId,
  fetchUrl,
  currentRole,
}: {
  initialWorkflows: WorkflowSummaryDTO[];
  projects: { id: string; name: string }[];
  /** When set (per-project page), hides the project filter and scopes creation to it. */
  fixedProjectId?: string;
  fetchUrl: string;
  currentRole: Role;
}) {
  const readOnly = !canWrite(currentRole);
  const router = useRouter();
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [kindFilter, setKindFilter] = useState<"ALL" | "TEMPLATE" | "PROJECT">("ALL");
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<WorkflowSummaryDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (kindFilter === "ALL") return workflows;
    return workflows.filter((w) => (kindFilter === "TEMPLATE" ? w.isTemplate : !w.isTemplate));
  }, [workflows, kindFilter]);

  async function refetch() {
    const res = await fetch(fetchUrl);
    if (res.ok) setWorkflows((await res.json()).workflows);
  }

  async function handleCreate(values: WorkflowMetaFormValues) {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo crear el flujo";
    router.push(`/workflows/${data.workflow.id}`);
  }

  async function handleDuplicate(workflow: WorkflowSummaryDTO) {
    setDuplicatingId(workflow.id);
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/duplicate`, { method: "POST" });
      if (res.ok) await refetch();
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/workflows/${pendingDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setPendingDelete(null);
        await refetch();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {!fixedProjectId ? (
          <Select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as typeof kindFilter)}
            className="w-auto"
          >
            <option value="ALL">Todos los flujos</option>
            <option value="TEMPLATE">Solo plantillas</option>
            <option value="PROJECT">Solo de proyecto</option>
          </Select>
        ) : (
          <p className="text-xs text-muted">{workflows.length} flujo(s) en este proyecto</p>
        )}
        {!readOnly && (
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} />
            Nuevo flujo
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm font-medium text-foreground">Todavía no hay flujos</p>
          <p className="max-w-sm text-sm text-muted">
            Documenta un proceso operativo (ventas, onboarding, aprobaciones) como diagrama visual.
          </p>
          {!readOnly && (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} />
              Nuevo flujo
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <Card key={w.id} className="flex flex-col p-4">
              <Link href={`/workflows/${w.id}`} className="mb-2 flex items-start justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-accent">
                  {w.isTemplate ? (
                    <LayoutTemplate size={14} className="shrink-0 text-accent" />
                  ) : (
                    <WorkflowIcon size={14} className="shrink-0 text-accent" />
                  )}
                  {w.name}
                </span>
                <Badge tone="neutral">v{w.version}</Badge>
              </Link>
              <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                {w.isTemplate ? (
                  <Badge tone="accent">Plantilla</Badge>
                ) : w.project ? (
                  <span>{w.project.name}</span>
                ) : (
                  <span>Sin proyecto</span>
                )}
                <span>· {w.nodeCount ?? 0} nodo(s)</span>
              </div>
              <p className="mt-auto text-xs text-muted">Actualizado {formatDate(w.updatedAt)}</p>
              {!readOnly && (
                <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicate(w)}
                    disabled={duplicatingId === w.id}
                  >
                    <Copy size={14} />
                    Duplicar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(w)}>
                    <Trash2 size={14} className="text-danger" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo flujo">
        <WorkflowMetaForm
          projects={projects}
          defaultProjectId={fixedProjectId}
          onCancel={() => setCreating(false)}
          submitLabel="Crear flujo"
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal open={pendingDelete !== null} onClose={() => setPendingDelete(null)} title="Eliminar flujo">
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
