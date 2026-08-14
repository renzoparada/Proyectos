"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { RISK_CATEGORY_META, RISK_STATUS_META, RISK_SCALE_LABELS, severityBand } from "@/lib/risk-meta";
import type { RiskDTO } from "@/types/risk";
import type { UserOptionDTO } from "@/types/task";

export type RiskFormValues = {
  projectId: string;
  name: string;
  description: string;
  category: string;
  probability: string;
  impact: string;
  status: string;
  mitigationPlan: string;
  ownerId: string;
};

function toFormValues(risk?: RiskDTO | null, defaultProjectId?: string): RiskFormValues {
  return {
    projectId: risk?.projectId ?? defaultProjectId ?? "",
    name: risk?.name ?? "",
    description: risk?.description ?? "",
    category: risk?.category ?? "OTHER",
    probability: risk?.probability?.toString() ?? "3",
    impact: risk?.impact?.toString() ?? "3",
    status: risk?.status ?? "IDENTIFIED",
    mitigationPlan: risk?.mitigationPlan ?? "",
    ownerId: risk?.ownerId ?? "",
  };
}

export function RiskForm({
  risk,
  users,
  projects,
  defaultProjectId,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  risk?: RiskDTO | null;
  users: UserOptionDTO[];
  /** When provided, shows a project picker (used on the consolidated /risks page). */
  projects?: { id: string; name: string }[];
  defaultProjectId?: string;
  onSubmit: (values: RiskFormValues) => Promise<string | null | void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<RiskFormValues>(() => toFormValues(risk, defaultProjectId));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof RiskFormValues>(key: K, value: RiskFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (projects && !values.projectId) {
      setError("Selecciona un proyecto");
      return;
    }
    setSubmitting(true);
    try {
      const err = await onSubmit(values);
      if (err) setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const previewSeverity = Number(values.probability) * Number(values.impact);
  const previewBand = severityBand(previewSeverity);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {projects && (
        <Field label="Proyecto *">
          <Select value={values.projectId} onChange={(e) => update("projectId", e.target.value)} required>
            <option value="">Selecciona un proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Nombre *">
        <Input
          required
          maxLength={200}
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ej: Dependencia de proveedor único"
          autoFocus={!projects}
        />
      </Field>

      <Field label="Descripción">
        <Textarea
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Qué podría pasar y por qué es un riesgo"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Categoría">
          <Select value={values.category} onChange={(e) => update("category", e.target.value)}>
            {Object.entries(RISK_CATEGORY_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={values.status} onChange={(e) => update("status", e.target.value)}>
            {Object.entries(RISK_STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Probabilidad">
          <Select value={values.probability} onChange={(e) => update("probability", e.target.value)}>
            {Object.entries(RISK_SCALE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {value} — {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Impacto">
          <Select value={values.impact} onChange={(e) => update("impact", e.target.value)}>
            {Object.entries(RISK_SCALE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {value} — {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${previewBand.className}`}>
        <span>Severidad calculada</span>
        <span className="font-semibold">
          {previewSeverity} · {previewBand.label}
        </span>
      </div>

      <Field label="Plan de mitigación / contingencia">
        <Textarea
          value={values.mitigationPlan}
          onChange={(e) => update("mitigationPlan", e.target.value)}
          placeholder="Qué se hará para reducir la probabilidad o el impacto"
        />
      </Field>

      <Field label="Responsable de seguimiento">
        <Select value={values.ownerId} onChange={(e) => update("ownerId", e.target.value)}>
          <option value="">Sin asignar</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      </Field>

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
