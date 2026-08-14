import { NextResponse } from "next/server";
import { getSession, requireApiRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { workflowMetaSchema } from "@/lib/validations/workflow";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: {
      nodes: true,
      edges: true,
      project: { select: { id: true, name: true } },
    },
  });
  if (!workflow) return NextResponse.json({ error: "Flujo no encontrado" }, { status: 404 });
  return NextResponse.json({ workflow });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const gate = await requireApiRole();
  if (gate.response) return gate.response;
  const { session } = gate;

  const { id } = await params;
  const existing = await prisma.workflow.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Flujo no encontrado" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = workflowMetaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (!data.isTemplate && !data.projectId) {
    return NextResponse.json(
      { error: "Selecciona un proyecto o márcalo como plantilla" },
      { status: 400 }
    );
  }

  const workflow = await prisma.workflow.update({
    where: { id },
    data: {
      name: data.name,
      isTemplate: data.isTemplate,
      projectId: data.isTemplate ? null : data.projectId,
    },
    include: { nodes: true, edges: true, project: { select: { id: true, name: true } } },
  });

  await logActivity({
    entityType: "Workflow",
    entityId: workflow.id,
    action: "updated",
    userId: session.sub,
    metadata: { name: workflow.name },
  });

  return NextResponse.json({ workflow });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const gate = await requireApiRole();
  if (gate.response) return gate.response;
  const { session } = gate;

  const { id } = await params;
  const existing = await prisma.workflow.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Flujo no encontrado" }, { status: 404 });

  await prisma.workflow.delete({ where: { id } });
  await logActivity({
    entityType: "Workflow",
    entityId: id,
    action: "deleted",
    userId: session.sub,
    metadata: { name: existing.name },
  });

  return NextResponse.json({ ok: true });
}
