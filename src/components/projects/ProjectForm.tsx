"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { PROJECT_STATUS_META } from "@/lib/project-status";
import { toDateInputValue } from "@/lib/utils";
import type { ProjectDTO } from "@/types/project";

export type ProjectFormValues = {
  name: string;
  description: string;
  client: string;
  startDate: string;
  endDate: string;
  status: string;
  budgetPlanned: string;
  budgetSpent: string;
};

function toFormValues(project?: ProjectDTO | null): ProjectFormValues {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    client: project?.client ?? "",
    startDate: toDateInputValue(project?.startDate),
    endDate: toDateInputValue(project?.endDate),
    status: project?.status ?? "PLANNING",
    budgetPlanned: project?.budgetPlanned?.toString() ?? "",
    budgetSpent: project?.budgetSpent?.toString() ?? "",
  };
}

export function ProjectForm({
  project,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  project?: ProjectDTO | null;
  onSubmit: (values: ProjectFormValues) => Promise<string | null | void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<ProjectFormValues>(() => toFormValues(project));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nombre *">
        <Input
          required
          maxLength={200}
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ej: Rediseño plataforma de pagos"
          autoFocus
        />
      </Field>

      <Field label="Descripción">
        <Textarea
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Objetivo y alcance del proyecto"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cliente / área">
          <Input
            value={values.client}
            onChange={(e) => update("client", e.target.value)}
            placeholder="Ej: Marketing, Acme Inc."
          />
        </Field>
        <Field label="Estado">
          <Select value={values.status} onChange={(e) => update("status", e.target.value)}>
            {Object.entries(PROJECT_STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha inicio">
          <Input
            type="date"
            value={values.startDate}
            onChange={(e) => update("startDate", e.target.value)}
          />
        </Field>
        <Field label="Fecha fin">
          <Input
            type="date"
            value={values.endDate}
            onChange={(e) => update("endDate", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Presupuesto planeado">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={values.budgetPlanned}
            onChange={(e) => update("budgetPlanned", e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Presupuesto gastado">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={values.budgetSpent}
            onChange={(e) => update("budgetSpent", e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>

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
