import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const source = await prisma.workflow.findUnique({
    where: { id },
    include: { nodes: true, edges: true },
  });
  if (!source) return NextResponse.json({ error: "Flujo no encontrado" }, { status: 404 });

  const duplicate = await prisma.$transaction(async (tx) => {
    const created = await tx.workflow.create({
      data: {
        name: `${source.name} (copia)`,
        isTemplate: source.isTemplate,
        projectId: source.projectId,
      },
    });

    const idMap = new Map<string, string>();
    for (const n of source.nodes) {
      const newNode = await tx.workflowNode.create({
        data: {
          workflowId: created.id,
          type: n.type,
          label: n.label,
          positionX: n.positionX,
          positionY: n.positionY,
          data: n.data ?? undefined,
        },
      });
      idMap.set(n.id, newNode.id);
    }
    for (const e of source.edges) {
      const sourceId = idMap.get(e.sourceNodeId);
      const targetId = idMap.get(e.targetNodeId);
      if (!sourceId || !targetId) continue;
      await tx.workflowEdge.create({
        data: { workflowId: created.id, sourceNodeId: sourceId, targetNodeId: targetId, label: e.label },
      });
    }

    return tx.workflow.findUniqueOrThrow({
      where: { id: created.id },
      include: { nodes: true, edges: true, project: { select: { id: true, name: true } } },
    });
  });

  await logActivity({
    entityType: "Workflow",
    entityId: duplicate.id,
    action: "duplicated",
    userId: session.sub,
    metadata: { name: duplicate.name, sourceId: source.id },
  });

  return NextResponse.json({ workflow: duplicate }, { status: 201 });
}
