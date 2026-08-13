"use client";

import { AlertTriangle, Flag, Pencil, Trash2 } from "lucide-react";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/tasks/TaskBadges";
import { formatDate } from "@/lib/utils";
import { isOverdue } from "@/lib/gantt-dates";
import type { TaskDTO } from "@/types/task";

export function TaskListView({
  tasks,
  onEdit,
  onDelete,
}: {
  tasks: TaskDTO[];
  onEdit: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface py-16 text-center">
        <p className="text-sm font-medium text-foreground">No hay tareas todavía</p>
        <p className="text-sm text-muted">Crea la primera tarea para verla aquí.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface scrollbar-thin">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted">
            <th className="px-4 py-2.5">Nombre</th>
            <th className="px-4 py-2.5">Estado</th>
            <th className="px-4 py-2.5">Prioridad</th>
            <th className="px-4 py-2.5">Responsable</th>
            <th className="px-4 py-2.5">Inicio</th>
            <th className="px-4 py-2.5">Fin</th>
            <th className="px-4 py-2.5">Avance</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            return (
              <tr key={task.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => onEdit(task)}
                    className="flex items-center gap-1.5 text-left font-medium text-foreground hover:text-accent"
                  >
                    {task.isMilestone && <Flag size={13} className="shrink-0 text-accent" />}
                    {overdue && <AlertTriangle size={13} className="shrink-0 text-danger" />}
                    <span className="truncate">{task.name}</span>
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <TaskStatusBadge status={task.status} />
                </td>
                <td className="px-4 py-2.5">
                  <TaskPriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-2.5 text-foreground">{task.assignee?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-foreground">{formatDate(task.startDate)}</td>
                <td className={overdue ? "px-4 py-2.5 font-medium text-danger" : "px-4 py-2.5 text-foreground"}>
                  {formatDate(task.endDate)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-hover">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${task.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted">{task.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(task)}
                      className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(task)}
                      className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-danger"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
