"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { PROJECT_STATUS_META } from "@/lib/project-status";
import { formatBudget, formatDate } from "@/lib/utils";
import type { ProjectDTO } from "@/types/project";

function toPayload(values: ProjectFormValues) {
  return {
    name: values.name,
    description: values.description,
    client: values.client,
    startDate: values.startDate,
    endDate: values.endDate,
    status: values.status,
    budgetPlanned: values.budgetPlanned,
    budgetSpent: values.budgetSpent,
  };
}

export function ProjectsView({ initialProjects }: { initialProjects: ProjectDTO[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; project: ProjectDTO } | null>(
    null
  );
  const [pendingDelete, setPendingDelete] = useState<ProjectDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase()))
        return false;
      return true;
    });
  }, [projects, search, statusFilter]);

  async function refetch() {
    const res = await fetch("/api/projects");
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects);
    }
  }

  async function handleCreate(values: ProjectFormValues) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(values)),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo crear el proyecto";
    setModal(null);
    await refetch();
  }

  async function handleEdit(project: ProjectDTO, values: ProjectFormValues) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(values)),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo actualizar el proyecto";
    setModal(null);
    await refetch();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${pendingDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== pendingDelete.id));
        setPendingDelete(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Proyectos</h1>
          <p className="text-sm text-muted">{projects.length} proyecto(s) en total</p>
        </div>
        <Button onClick={() => setModal({ mode: "create" })}>
          <Plus size={16} />
          Nuevo proyecto
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proyecto…"
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-56"
        >
          <option value="ALL">Todos los estados</option>
          {Object.entries(PROJECT_STATUS_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            {projects.length === 0 ? "Todavía no tienes proyectos" : "Sin resultados"}
          </p>
          <p className="max-w-sm text-sm text-muted">
            {projects.length === 0
              ? "Crea tu primer proyecto para empezar a organizar tareas, riesgos y flujos."
              : "Ajusta la búsqueda o el filtro de estado."}
          </p>
          {projects.length === 0 && (
            <Button onClick={() => setModal({ mode: "create" })}>
              <Plus size={16} />
              Nuevo proyecto
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card key={project.id} className="flex flex-col p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm font-semibold text-foreground hover:text-accent"
                >
                  {project.name}
                </Link>
                <ProjectStatusBadge status={project.status} />
              </div>
              {project.description && (
                <p className="mb-3 line-clamp-2 text-xs text-muted">{project.description}</p>
              )}
              <div className="mt-auto flex flex-col gap-1.5 text-xs text-muted">
                <p>Cliente: {project.client ?? "—"}</p>
                <p>
                  {formatDate(project.startDate)} → {formatDate(project.endDate)}
                </p>
                {(project.budgetPlanned || project.budgetSpent) && (
                  <p>
                    Presupuesto: {formatBudget(project.budgetSpent)} / {formatBudget(project.budgetPlanned)}
                  </p>
                )}
                {project._count && (
                  <p className="flex items-center gap-1">
                    <Users size={12} /> {project._count.tasks} tareas · {project._count.risks}{" "}
                    riesgos
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setModal({ mode: "edit", project })}
                >
                  <Pencil size={14} />
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingDelete(project)}>
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Editar proyecto" : "Nuevo proyecto"}
      >
        <ProjectForm
          project={modal?.mode === "edit" ? modal.project : null}
          onCancel={() => setModal(null)}
          submitLabel={modal?.mode === "edit" ? "Guardar cambios" : "Crear proyecto"}
          onSubmit={(values) =>
            modal?.mode === "edit" ? handleEdit(modal.project, values) : handleCreate(values)
          }
        />
      </Modal>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Eliminar proyecto"
      >
        <p className="text-sm text-foreground">
          ¿Seguro que quieres eliminar <strong>{pendingDelete?.name}</strong>? Esta acción
          también eliminará sus tareas, riesgos y flujos asociados. No se puede deshacer.
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
