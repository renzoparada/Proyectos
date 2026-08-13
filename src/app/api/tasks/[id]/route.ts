import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { taskInputSchema } from "@/lib/validations/task";

type RouteParams = { params: Promise<{ id: string }> };

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  dependsOn: { select: { id: true, dependsOnTaskId: true, type: true } },
} as const;

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  if (!task) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  return NextResponse.json({ task });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = taskInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.dependsOnTaskIds.includes(id)) {
    return NextResponse.json(
      { error: "Una tarea no puede depender de sí misma" },
      { status: 400 }
    );
  }

  const dependsOnTaskIds = [...new Set(data.dependsOnTaskIds.filter(Boolean))];

  const task = await prisma.$transaction(async (tx) => {
    await tx.taskDependency.deleteMany({ where: { taskId: id } });
    return tx.task.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
        startDate: data.startDate,
        endDate: data.isMilestone ? data.startDate : data.endDate,
        progress: data.progress,
        status: data.status,
        priority: data.priority,
        isMilestone: data.isMilestone,
        assigneeId: data.assigneeId ?? null,
        dependsOn: dependsOnTaskIds.length
          ? { create: dependsOnTaskIds.map((depId) => ({ dependsOnTaskId: depId })) }
          : undefined,
      },
      include: taskInclude,
    });
  });

  await logActivity({
    entityType: "Task",
    entityId: task.id,
    action: existing.status !== task.status ? "status_changed" : "updated",
    userId: session.sub,
    metadata: { name: task.name, projectId: task.projectId },
  });

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  await logActivity({
    entityType: "Task",
    entityId: id,
    action: "deleted",
    userId: session.sub,
    metadata: { name: existing.name, projectId: existing.projectId },
  });

  return NextResponse.json({ ok: true });
}
