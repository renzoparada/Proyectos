import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { workflowGraphSchema } from "@/lib/validations/workflow";
import type { Prisma } from "@/generated/prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

// Full-graph save: the editor sends its whole node/edge set on every save
// (there's no real-time collab to reconcile), so the simplest correct model
// is to replace everything for this workflow inside one transaction.
export async function PUT(request: Request, { params }: RouteParams) {
  const gate = await requireApiRole();
  if (gate.response) return gate.response;
  const { session } = gate;

  const { id } = await params;
  const existing = await prisma.workflow.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Flujo no encontrado" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = workflowGraphSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { nodes, edges } = parsed.data;
  const bumpVersion = new URL(request.url).searchParams.get("bumpVersion") === "true";

  const workflow = await prisma.$transaction(async (tx) => {
    await tx.workflowEdge.deleteMany({ where: { workflowId: id } });
    await tx.workflowNode.deleteMany({ where: { workflowId: id } });

    const idMap = new Map<string, string>();
    for (const n of nodes) {
      const created = await tx.workflowNode.create({
        data: {
          workflowId: id,
          type: n.type,
          label: n.label,
          positionX: n.positionX,
          positionY: n.positionY,
          data: (n.data as Prisma.InputJsonValue) ?? undefined,
        },
      });
      idMap.set(n.clientId, created.id);
    }

    for (const e of edges) {
      const sourceId = idMap.get(e.sourceClientId);
      const targetId = idMap.get(e.targetClientId);
      if (!sourceId || !targetId) continue;
      await tx.workflowEdge.create({
        data: { workflowId: id, sourceNodeId: sourceId, targetNodeId: targetId, label: e.label ?? null },
      });
    }

    return tx.workflow.update({
      where: { id },
      data: bumpVersion ? { version: { increment: 1 } } : {},
      include: { nodes: true, edges: true, project: { select: { id: true, name: true } } },
    });
  });

  await logActivity({
    entityType: "Workflow",
    entityId: workflow.id,
    action: bumpVersion ? "versioned" : "graph_saved",
    userId: session.sub,
    metadata: { name: workflow.name, version: workflow.version },
  });

  return NextResponse.json({ workflow });
}
