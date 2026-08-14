import { NextResponse } from "next/server";
import { requireApiRole, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { updateUserSchema } from "@/lib/validations/user";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const gate = await requireApiRole("ADMIN");
  if (gate.response) return gate.response;
  const { session } = gate;

  const { id } = await params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // You can rename yourself or change your own password, but never demote
  // yourself out of ADMIN — that would risk locking everyone out.
  if (id === session.sub && data.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No puedes quitarte tu propio rol de administrador" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      role: data.role,
      passwordHash: data.password ? await hashPassword(data.password) : undefined,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await logActivity({
    entityType: "User",
    entityId: user.id,
    action: "updated",
    userId: session.sub,
    metadata: { name: user.name, role: user.role },
  });

  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const gate = await requireApiRole("ADMIN");
  if (gate.response) return gate.response;
  const { session } = gate;

  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (existing.role === "ADMIN") {
    const otherAdmins = await prisma.user.count({ where: { role: "ADMIN", id: { not: id } } });
    if (otherAdmins === 0) {
      return NextResponse.json(
        { error: "No puedes eliminar al único administrador" },
        { status: 400 }
      );
    }
  }

  await prisma.user.delete({ where: { id } });
  await logActivity({
    entityType: "User",
    entityId: id,
    action: "deleted",
    userId: session.sub,
    metadata: { name: existing.name },
  });

  return NextResponse.json({ ok: true });
}
