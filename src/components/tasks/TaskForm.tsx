"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { TASK_STATUS_META, TASK_PRIORITY_META } from "@/lib/task-meta";
import { diffInDays } from "@/lib/gantt-dates";
import { toDateInputValue } from "@/lib/utils";
import type { TaskDTO, UserOptionDTO } from "@/types/task";

export type TaskFormValues = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: string;
  status: string;
  priority: string;
  isMilestone: boolean;
  assigneeId: string;
  dependsOnTaskIds: string[];
};

function toFormValues(task?: TaskDTO | null): TaskFormValues {
  const today = toDateInputValue(new Date());
  return {
    name: task?.name ?? "",
    description: task?.description ?? "",
    startDate: toDateInputValue(task?.startDate) || today,
    endDate: toDateInputValue(task?.endDate) || today,
    progress: task?.progress?.toString() ?? "0",
    status: task?.status ?? "TODO",
    priority: task?.priority ?? "MEDIUM",
    isMilestone: task?.isMilestone ?? false,
    assigneeId: task?.assigneeId ?? "",
    dependsOnTaskIds: task?.dependsOn.map((d) => d.dependsOnTaskId) ?? [],
  };
}

export function TaskForm({
  task,
  users,
  otherTasks,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  task?: TaskDTO | null;
  users: UserOptionDTO[];
  otherTasks: TaskDTO[];
  onSubmit: (values: TaskFormValues) => Promise<string | null | void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<TaskFormValues>(() => toFormValues(task));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleDependency(id: string) {
    setValues((v) => ({
      ...v,
      dependsOnTaskIds: v.dependsOnTaskIds.includes(id)
        ? v.dependsOnTaskIds.filter((d) => d !== id)
        : [...v.dependsOnTaskIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const err = await onSubmit(values);
      if (err) setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const duration = Math.max(1, diffInDays(values.endDate || values.startDate, values.startDate) + 1);
  const candidateTasks = otherTasks.filter((t) => t.id !== task?.id);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nombre *">
        <Input
          required
          maxLength={200}
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ej: Diseñar wireframes"
          autoFocus
        />
      </Field>

      <Field label="Descripción">
        <Textarea
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Detalle de la tarea"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={values.isMilestone}
          onChange={(e) => update("isMilestone", e.target.checked)}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        Es un hito (fecha única, sin duración)
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha inicio *">
          <Input
            type="date"
            required
            value={values.startDate}
            onChange={(e) => update("startDate", e.target.value)}
          />
        </Field>
        {!values.isMilestone && (
          <Field label="Fecha fin *" hint={`Duración: ${duration} día(s)`}>
            <Input
              type="date"
              required
              min={values.startDate}
              value={values.endDate}
              onChange={(e) => update("endDate", e.target.value)}
            />
          </Field>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Estado">
          <Select value={values.status} onChange={(e) => update("status", e.target.value)}>
            {Object.entries(TASK_STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridad">
          <Select value={values.priority} onChange={(e) => update("priority", e.target.value)}>
            {Object.entries(TASK_PRIORITY_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Responsable">
          <Select value={values.assigneeId} onChange={(e) => update("assigneeId", e.target.value)}>
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`Avance (${values.progress}%)`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={values.progress}
            onChange={(e) => update("progress", e.target.value)}
            className="mt-2.5 w-full accent-accent"
          />
        </Field>
      </div>

      {candidateTasks.length > 0 && (
        <Field label="Depende de (predecesoras)" hint="Esta tarea empieza después de que terminen las seleccionadas">
          <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border p-2 scrollbar-thin">
            {candidateTasks.map((t) => (
              <label key={t.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-surface-hover">
                <input
                  type="checkbox"
                  checked={values.dependsOnTaskIds.includes(t.id)}
                  onChange={() => toggleDependency(t.id)}
                  className="h-3.5 w-3.5 rounded border-border accent-accent"
                />
                <span className="truncate text-foreground">{t.name}</span>
              </label>
            ))}
          </div>
        </Field>
      )}

      {error && <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
