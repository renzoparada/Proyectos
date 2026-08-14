import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { riskInputSchema } from "@/lib/validations/risk";

type RouteParams = { params: Promise<{ id: string }> };

const riskInclude = {
  owner: { select: { id: true, name: true, email: true } },
} as const;

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId } = await params;
  const risks = await prisma.risk.findMany({
    where: { projectId },
    include: riskInclude,
    orderBy: { severity: "desc" },
  });

  return NextResponse.json({ risks });
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = riskInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const risk = await prisma.risk.create({
    data: {
      projectId,
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
    action: "created",
    userId: session.sub,
    metadata: { name: risk.name, projectId, severity: risk.severity },
  });

  return NextResponse.json({ risk }, { status: 201 });
}
