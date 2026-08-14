"use client";

import { useState } from "react";
import { AlertTriangle, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { isOverdue } from "@/lib/gantt-dates";
import { KANBAN_COLUMNS, TASK_STATUS_META, type TaskStatus } from "@/lib/task-meta";
import { TaskPriorityBadge } from "@/components/tasks/TaskBadges";
import type { TaskDTO } from "@/types/task";

export function TaskKanbanView({
  tasks,
  onEdit,
  onStatusChange,
  readOnly = false,
}: {
  tasks: TaskDTO[];
  onEdit?: (task: TaskDTO) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  readOnly?: boolean;
}) {
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {KANBAN_COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const meta = TASK_STATUS_META[status];
        return (
          <div
            key={status}
            onDragOver={(e) => {
              if (readOnly) return;
              e.preventDefault();
              setDragOverColumn(status);
            }}
            onDragLeave={() => setDragOverColumn((c) => (c === status ? null : c))}
            onDrop={(e) => {
              if (readOnly) return;
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/plain");
              setDragOverColumn(null);
              setDraggingId(null);
              if (taskId) onStatusChange(taskId, status);
            }}
            className={cn(
              "flex min-h-[200px] flex-col gap-2 rounded-lg border border-border bg-surface p-2.5 transition-colors",
              dragOverColumn === status && "border-accent bg-accent/5"
            )}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-foreground">{meta.label}</span>
              <span className="rounded-full bg-surface-hover px-1.5 py-0.5 text-[11px] text-muted">
                {columnTasks.length}
              </span>
            </div>

            {columnTasks.map((task) => {
              const overdue = isOverdue(task);
              return (
                <button
                  key={task.id}
                  draggable={!readOnly}
                  onDragStart={(e) => {
                    if (readOnly) return;
                    e.dataTransfer.setData("text/plain", task.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingId(task.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => onEdit?.(task)}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-md border border-border bg-background p-2.5 text-left shadow-sm hover:border-accent/40",
                    draggingId === task.id && "opacity-40"
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    {task.isMilestone && <Flag size={12} className="shrink-0 text-accent" />}
                    {overdue && <AlertTriangle size={12} className="shrink-0 text-danger" />}
                    <span className="line-clamp-2">{task.name}</span>
                  </span>
                  <div className="flex items-center justify-between">
                    <TaskPriorityBadge priority={task.priority} />
                    <span className={cn("text-[11px]", overdue ? "font-medium text-danger" : "text-muted")}>
                      {formatDate(task.endDate)}
                    </span>
                  </div>
                  {task.assignee && (
                    <span className="truncate text-[11px] text-muted">{task.assignee.name}</span>
                  )}
                </button>
              );
            })}

            {columnTasks.length === 0 && (
              <p className="px-1 py-4 text-center text-xs text-muted">Sin tareas</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
