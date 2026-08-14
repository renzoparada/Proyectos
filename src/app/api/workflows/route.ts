import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { workflowMetaSchema } from "@/lib/validations/workflow";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const isTemplate = searchParams.get("isTemplate");

  const workflows = await prisma.workflow.findMany({
    where: {
      projectId: projectId ?? undefined,
      isTemplate: isTemplate === "true" ? true : isTemplate === "false" ? false : undefined,
    },
    include: {
      project: { select: { id: true, name: true } },
      _count: { select: { nodes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    workflows: workflows.map((w) => ({ ...w, nodeCount: w._count.nodes })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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

  // Seed with a Start/End pair so the canvas isn't empty on first open.
  const workflow = await prisma.workflow.create({
    data: {
      name: data.name,
      isTemplate: data.isTemplate,
      projectId: data.isTemplate ? null : data.projectId,
      nodes: {
        create: [
          { type: "START", label: "Inicio", positionX: 80, positionY: 160 },
          { type: "END", label: "Fin", positionX: 480, positionY: 160 },
        ],
      },
    },
    include: { nodes: true, edges: true, project: { select: { id: true, name: true } } },
  });

  await logActivity({
    entityType: "Workflow",
    entityId: workflow.id,
    action: "created",
    userId: session.sub,
    metadata: { name: workflow.name, projectId: workflow.projectId },
  });

  return NextResponse.json({ workflow }, { status: 201 });
}
