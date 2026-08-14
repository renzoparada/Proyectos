"use client";

import { useMemo, useState } from "react";
import { Download, Plus, GanttChartSquare, List, Kanban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { GanttChart } from "@/components/tasks/GanttChart";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskKanbanView } from "@/components/tasks/TaskKanbanView";
import { TaskForm, type TaskFormValues } from "@/components/tasks/TaskForm";
import { cn, formatDate } from "@/lib/utils";
import { canWrite, type Role } from "@/lib/permissions";
import { toCsv, downloadCsv } from "@/lib/csv";
import { TASK_STATUS_META, TASK_PRIORITY_META, type TaskStatus } from "@/lib/task-meta";
import type { TaskDTO, UserOptionDTO } from "@/types/task";

type ViewMode = "gantt" | "list" | "kanban";

function toPayload(values: TaskFormValues) {
  return {
    name: values.name,
    description: values.description,
    startDate: values.startDate,
    endDate: values.isMilestone ? values.startDate : values.endDate,
    progress: values.progress,
    status: values.status,
    priority: values.priority,
    isMilestone: values.isMilestone,
    assigneeId: values.assigneeId,
    dependsOnTaskIds: values.dependsOnTaskIds,
  };
}

export function TasksView({
  projectId,
  initialTasks,
  users,
  currentRole,
}: {
  projectId: string;
  initialTasks: TaskDTO[];
  users: UserOptionDTO[];
  currentRole: Role;
}) {
  const readOnly = !canWrite(currentRole);
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<ViewMode>("gantt");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; task: TaskDTO } | null>(
    null
  );
  const [pendingDelete, setPendingDelete] = useState<TaskDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (assigneeFilter !== "ALL") {
        if (assigneeFilter === "UNASSIGNED" ? t.assigneeId : t.assigneeId !== assigneeFilter)
          return false;
      }
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, assigneeFilter, statusFilter, priorityFilter]);

  async function refetch() {
    const res = await fetch(`/api/projects/${projectId}/tasks`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
  }

  async function handleCreate(values: TaskFormValues) {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(values)),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo crear la tarea";
    setModal(null);
    await refetch();
  }

  async function handleEdit(task: TaskDTO, values: TaskFormValues) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(values)),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo actualizar la tarea";
    setModal(null);
    await refetch();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${pendingDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setPendingDelete(null);
        await refetch();
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleDatesChange(taskId: string, startDate: Date, endDate: Date) {
    // Optimistic local update so the bar doesn't snap back while the request is in flight.
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
          : t
      )
    );
    const res = await fetch(`/api/tasks/${taskId}/dates`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });
    if (res.ok) {
      await refetch();
    } else {
      await refetch(); // revert to server truth on failure too
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await refetch();
  }

  const overdueCount = tasks.filter(
    (t) => t.status !== "DONE" && new Date(t.endDate) < new Date(new Date().toDateString())
  ).length;

  function handleExport() {
    const csv = toCsv(filtered, [
      { header: "Nombre", value: (t) => t.name },
      { header: "Estado", value: (t) => TASK_STATUS_META[t.status].label },
      { header: "Prioridad", value: (t) => TASK_PRIORITY_META[t.priority].label },
      { header: "Responsable", value: (t) => t.assignee?.name },
      { header: "Fecha inicio", value: (t) => formatDate(t.startDate) },
      { header: "Fecha fin", value: (t) => formatDate(t.endDate) },
      { header: "Avance %", value: (t) => t.progress },
      { header: "Hito", value: (t) => (t.isMilestone ? "Sí" : "No") },
    ]);
    downloadCsv(`tareas-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
          <ViewTab active={view === "gantt"} onClick={() => setView("gantt")} icon={GanttChartSquare} label="Gantt" />
          <ViewTab active={view === "list"} onClick={() => setView("list")} icon={List} label="Lista" />
          <ViewTab active={view === "kanban"} onClick={() => setView("kanban")} icon={Kanban} label="Kanban" />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} />
            Exportar CSV
          </Button>
          {!readOnly && (
            <Button onClick={() => setModal({ mode: "create" })}>
              <Plus size={16} />
              Nueva tarea
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="w-auto">
          <option value="ALL">Todos los responsables</option>
          <option value="UNASSIGNED">Sin asignar</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="ALL">Todos los estados</option>
          {Object.entries(TASK_STATUS_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-auto">
          <option value="ALL">Todas las prioridades</option>
          {Object.entries(TASK_PRIORITY_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
        <span className="ml-auto text-xs text-muted">
          {filtered.length} tarea(s){overdueCount > 0 && <span className="text-danger"> · {overdueCount} vencida(s)</span>}
        </span>
      </div>

      {view === "gantt" && (
        <GanttChart
          tasks={filtered}
          onOpenTask={readOnly ? undefined : (task) => setModal({ mode: "edit", task })}
          onDatesChange={handleDatesChange}
          readOnly={readOnly}
        />
      )}
      {view === "list" && (
        <TaskListView
          tasks={filtered}
          onEdit={readOnly ? undefined : (task) => setModal({ mode: "edit", task })}
          onDelete={readOnly ? undefined : (task) => setPendingDelete(task)}
        />
      )}
      {view === "kanban" && (
        <TaskKanbanView
          tasks={filtered}
          onEdit={readOnly ? undefined : (task) => setModal({ mode: "edit", task })}
          onStatusChange={handleStatusChange}
          readOnly={readOnly}
        />
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Editar tarea" : "Nueva tarea"}
      >
        <TaskForm
          task={modal?.mode === "edit" ? modal.task : null}
          users={users}
          otherTasks={tasks}
          onCancel={() => setModal(null)}
          submitLabel={modal?.mode === "edit" ? "Guardar cambios" : "Crear tarea"}
          onSubmit={(values) =>
            modal?.mode === "edit" ? handleEdit(modal.task, values) : handleCreate(values)
          }
        />
        {modal?.mode === "edit" && (
          <div className="mt-3 flex justify-end border-t border-border pt-3">
            <button
              onClick={() => {
                setPendingDelete(modal.task);
                setModal(null);
              }}
              className="text-xs font-medium text-danger hover:underline"
            >
              Eliminar tarea
            </button>
          </div>
        )}
      </Modal>

      <Modal open={pendingDelete !== null} onClose={() => setPendingDelete(null)} title="Eliminar tarea">
        <p className="text-sm text-foreground">
          ¿Seguro que quieres eliminar <strong>{pendingDelete?.name}</strong>? Las dependencias que
          la referencian también se eliminarán. No se puede deshacer.
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

function ViewTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof GanttChartSquare;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
