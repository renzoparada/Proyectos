import { NextResponse } from "next/server";
import { requireApiRole, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { createUserSchema } from "@/lib/validations/user";

// Full user directory + management — admin only. (The picker-friendly
// /api/users stays open to any logged-in user and only returns id/name/email.)
export async function GET() {
  const gate = await requireApiRole("ADMIN");
  if (gate.response) return gate.response;

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const gate = await requireApiRole("ADMIN");
  if (gate.response) return gate.response;
  const { session } = gate;

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await logActivity({
    entityType: "User",
    entityId: user.id,
    action: "created",
    userId: session.sub,
    metadata: { name: user.name, role: user.role },
  });

  return NextResponse.json({ user }, { status: 201 });
}
