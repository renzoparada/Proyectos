"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { formatBudget, formatDate } from "@/lib/utils";
import type { ProjectDTO } from "@/types/project";

const COMING_SOON_TABS = [
  { label: "Gantt / Tareas", phase: "Fase 2" },
  { label: "Riesgos", phase: "Fase 3" },
  { label: "Flujos", phase: "Fase 4" },
];

export function ProjectDetailView({ project: initial }: { project: ProjectDTO }) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleEdit(values: ProjectFormValues) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        description: values.description,
        client: values.client,
        startDate: values.startDate,
        endDate: values.endDate,
        status: values.status,
        budgetPlanned: values.budgetPlanned,
        budgetSpent: values.budgetSpent,
      }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo actualizar el proyecto";
    setProject(data.project);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/projects");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> Proyectos
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted">{project.description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} /> Editar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} className="text-danger" />
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoStat label="Cliente / área" value={project.client ?? "—"} />
        <InfoStat
          label="Fechas"
          value={`${formatDate(project.startDate)} → ${formatDate(project.endDate)}`}
        />
        <InfoStat label="Responsable" value={project.owner?.name ?? "—"} />
        <InfoStat
          label="Presupuesto"
          value={`${formatBudget(project.budgetSpent)} / ${formatBudget(project.budgetPlanned)}`}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Próximamente en este proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {COMING_SOON_TABS.map((tab) => (
              <div
                key={tab.label}
                className="rounded-md border border-dashed border-border p-4 text-center"
              >
                <p className="text-sm font-medium text-foreground">{tab.label}</p>
                <p className="mt-1 text-xs text-muted">Disponible en {tab.phase}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar proyecto">
        <ProjectForm
          project={project}
          onCancel={() => setEditing(false)}
          submitLabel="Guardar cambios"
          onSubmit={handleEdit}
        />
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Eliminar proyecto">
        <p className="text-sm text-foreground">
          ¿Seguro que quieres eliminar <strong>{project.name}</strong>? Esta acción también
          eliminará sus tareas, riesgos y flujos asociados. No se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>
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

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </Card>
  );
}
