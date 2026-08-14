"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { ROLE_META } from "@/lib/role-meta";
import type { UserDTO } from "@/types/user";

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export function UserForm({
  user,
  currentUserId,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  user?: UserDTO | null;
  currentUserId: string;
  onSubmit: (values: UserFormValues) => Promise<string | null | void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const isEditingSelf = user?.id === currentUserId;
  const [values, setValues] = useState<UserFormValues>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "COLLABORATOR",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
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
          maxLength={120}
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          autoFocus
        />
      </Field>

      <Field label="Email *">
        <Input
          type="email"
          required
          disabled={!!user}
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="persona@empresa.com"
        />
      </Field>

      <Field label={user ? "Nueva contraseña" : "Contraseña *"} hint={user ? "Déjalo en blanco para no cambiarla" : "Mínimo 8 caracteres"}>
        <Input
          type="password"
          required={!user}
          value={values.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder={user ? "••••••••" : ""}
        />
      </Field>

      <Field label="Rol" hint={isEditingSelf ? "No puedes quitarte tu propio rol de administrador" : undefined}>
        <Select
          value={values.role}
          disabled={isEditingSelf}
          onChange={(e) => update("role", e.target.value)}
        >
          {Object.entries(ROLE_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-muted">{ROLE_META[values.role as keyof typeof ROLE_META]?.description}</p>
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
