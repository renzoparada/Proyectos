"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { UserForm, type UserFormValues } from "@/components/team/UserForm";
import { ROLE_META } from "@/lib/role-meta";
import { formatDate } from "@/lib/utils";
import type { UserDTO } from "@/types/user";

export function TeamView({ initialUsers, currentUserId }: { initialUsers: UserDTO[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; user: UserDTO } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function refetch() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers((await res.json()).users);
  }

  async function handleCreate(values: UserFormValues) {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo crear el usuario";
    setModal(null);
    await refetch();
  }

  async function handleEdit(user: UserDTO, values: UserFormValues) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, role: values.role, password: values.password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo actualizar el usuario";
    setModal(null);
    await refetch();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/users/${pendingDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "No se pudo eliminar el usuario");
        return;
      }
      setPendingDelete(null);
      await refetch();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted">{users.length} usuario(s)</p>
        <Button onClick={() => setModal({ mode: "create" })}>
          <Plus size={16} />
          Invitar usuario
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface scrollbar-thin">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted">
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Rol</th>
              <th className="px-4 py-2.5">Desde</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {u.name}
                  {u.id === currentUserId && <span className="ml-1.5 text-xs text-muted">(tú)</span>}
                </td>
                <td className="px-4 py-2.5 text-muted">{u.email}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={ROLE_META[u.role].tone}>{ROLE_META[u.role].label}</Badge>
                </td>
                <td className="px-4 py-2.5 text-muted">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setModal({ mode: "edit", user: u })}
                      className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => setPendingDelete(u)}
                        className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-danger"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Editar usuario" : "Invitar usuario"}
      >
        <UserForm
          user={modal?.mode === "edit" ? modal.user : null}
          currentUserId={currentUserId}
          onCancel={() => setModal(null)}
          submitLabel={modal?.mode === "edit" ? "Guardar cambios" : "Crear usuario"}
          onSubmit={(values) =>
            modal?.mode === "edit" ? handleEdit(modal.user, values) : handleCreate(values)
          }
        />
      </Modal>

      <Modal
        open={pendingDelete !== null}
        onClose={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
        title="Eliminar usuario"
      >
        <p className="text-sm text-foreground">
          ¿Seguro que quieres eliminar a <strong>{pendingDelete?.name}</strong>? Sus tareas y riesgos
          asignados quedarán sin responsable. No se puede deshacer.
        </p>
        {deleteError && (
          <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{deleteError}</p>
        )}
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
