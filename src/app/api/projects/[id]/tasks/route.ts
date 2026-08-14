import { NextResponse } from "next/server";
import { getSession, requireApiRole } from "@/lib/auth";
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

  const { id: projectId } = await params;
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: taskInclude,
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request, { params }: RouteParams) {
  const gate = await requireApiRole();
  if (gate.response) return gate.response;
  const { session } = gate;

  const { id: projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = taskInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const dependsOnTaskIds = data.dependsOnTaskIds.filter(Boolean);

  const task = await prisma.task.create({
    data: {
      projectId,
      name: data.name,
      description: data.description ?? null,
      startDate: data.isMilestone ? data.startDate : data.startDate,
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

  await logActivity({
    entityType: "Task",
    entityId: task.id,
    action: "created",
    userId: session.sub,
    metadata: { name: task.name, projectId },
  });

  return NextResponse.json({ task }, { status: 201 });
}
