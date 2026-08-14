"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import type { WorkflowSummaryDTO } from "@/types/workflow";

export type WorkflowMetaFormValues = {
  name: string;
  isTemplate: boolean;
  projectId: string;
};

export function WorkflowMetaForm({
  workflow,
  projects,
  defaultProjectId,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  workflow?: Pick<WorkflowSummaryDTO, "name" | "isTemplate" | "projectId"> | null;
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
  onSubmit: (values: WorkflowMetaFormValues) => Promise<string | null | void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(workflow?.name ?? "");
  const [isTemplate, setIsTemplate] = useState(workflow?.isTemplate ?? !defaultProjectId);
  const [projectId, setProjectId] = useState(workflow?.projectId ?? defaultProjectId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isTemplate && !projectId) {
      setError("Selecciona un proyecto o márcalo como plantilla");
      return;
    }
    setSubmitting(true);
    try {
      const err = await onSubmit({ name, isTemplate, projectId });
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Flujo de onboarding de cliente"
          autoFocus
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={isTemplate}
          onChange={(e) => setIsTemplate(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        Guardar como plantilla reutilizable (sin proyecto asociado)
      </label>

      {!isTemplate && (
        <Field label="Proyecto *">
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
            <option value="">Selecciona un proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
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
