import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { riskInputSchema } from "@/lib/validations/risk";

type RouteParams = { params: Promise<{ id: string }> };

const riskInclude = {
  owner: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
} as const;

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const risk = await prisma.risk.findUnique({ where: { id }, include: riskInclude });
  if (!risk) return NextResponse.json({ error: "Riesgo no encontrado" }, { status: 404 });
  return NextResponse.json({ risk });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.risk.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Riesgo no encontrado" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = riskInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const risk = await prisma.risk.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      category: data.category,
      probability: data.probability,
      impact: data.impact,
      severity: data.probability * data.impact,
      status: data.status,
      mitigationPlan: data.mitigationPlan ?? null,
      ownerId: data.ownerId ?? null,
    },
    include: riskInclude,
  });

  await logActivity({
    entityType: "Risk",
    entityId: risk.id,
    action: existing.status !== risk.status ? "status_changed" : "updated",
    userId: session.sub,
    metadata: { name: risk.name, projectId: risk.projectId, severity: risk.severity },
  });

  return NextResponse.json({ risk });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.risk.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Riesgo no encontrado" }, { status: 404 });

  await prisma.risk.delete({ where: { id } });
  await logActivity({
    entityType: "Risk",
    entityId: id,
    action: "deleted",
    userId: session.sub,
    metadata: { name: existing.name, projectId: existing.projectId },
  });

  return NextResponse.json({ ok: true });
}
