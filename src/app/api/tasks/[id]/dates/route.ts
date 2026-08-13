import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { taskDateUpdateSchema } from "@/lib/validations/task";

type RouteParams = { params: Promise<{ id: string }> };

// Lightweight endpoint used by the Gantt drag/resize interactions: only
// touches dates, leaving everything else (including dependencies) alone.
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = taskDateUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { startDate, endDate } = parsed.data;
  const task = await prisma.task.update({
    where: { id },
    data: {
      startDate,
      endDate: existing.isMilestone ? startDate : endDate,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      dependsOn: { select: { id: true, dependsOnTaskId: true, type: true } },
    },
  });

  await logActivity({
    entityType: "Task",
    entityId: task.id,
    action: "rescheduled",
    userId: session.sub,
    metadata: { name: task.name, projectId: task.projectId },
  });

  return NextResponse.json({ task });
}
