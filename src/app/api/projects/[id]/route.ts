import { NextResponse } from "next/server";
import { getSession, requireApiRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { projectInputSchema } from "@/lib/validations/project";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, risks: true, workflows: true } },
    },
  });

  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const gate = await requireApiRole();
  if (gate.response) return gate.response;
  const { session } = gate;

  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = projectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const project = await prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      client: data.client ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      status: data.status,
      budgetPlanned: data.budgetPlanned ?? null,
      budgetSpent: data.budgetSpent ?? null,
    },
  });

  await logActivity({
    entityType: "Project",
    entityId: project.id,
    action: existing.status !== project.status ? "status_changed" : "updated",
    userId: session.sub,
    metadata: { name: project.name, from: existing.status, to: project.status },
  });

  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  // Deleting a project cascades to its tasks, risks and workflows — admin only.
  const gate = await requireApiRole("ADMIN");
  if (gate.response) return gate.response;
  const { session } = gate;

  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  await prisma.project.delete({ where: { id } });
  await logActivity({
    entityType: "Project",
    entityId: id,
    action: "deleted",
    userId: session.sub,
    metadata: { name: existing.name },
  });

  return NextResponse.json({ ok: true });
}
