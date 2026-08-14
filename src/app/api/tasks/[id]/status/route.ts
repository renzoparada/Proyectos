import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { taskStatusUpdateSchema } from "@/lib/validations/task";

type RouteParams = { params: Promise<{ id: string }> };

// Lightweight endpoint used by the Kanban drag-and-drop.
export async function PATCH(request: Request, { params }: RouteParams) {
  const gate = await requireApiRole();
  if (gate.response) return gate.response;
  const { session } = gate;

  const { id } = await params;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = taskStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const task = await prisma.task.update({
    where: { id },
    data: { status: parsed.data.status },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      dependsOn: { select: { id: true, dependsOnTaskId: true, type: true } },
    },
  });

  await logActivity({
    entityType: "Task",
    entityId: task.id,
    action: "status_changed",
    userId: session.sub,
    metadata: { name: task.name, projectId: task.projectId, to: task.status },
  });

  return NextResponse.json({ task });
}
