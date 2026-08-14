import { NextResponse } from "next/server";
import { getSession, requireApiRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { projectInputSchema, PROJECT_STATUSES } from "@/lib/validations/project";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const projects = await prisma.project.findMany({
    where: {
      status:
        status && (PROJECT_STATUSES as readonly string[]).includes(status)
          ? (status as (typeof PROJECT_STATUSES)[number])
          : undefined,
      name: q ? { contains: q, mode: "insensitive" } : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, risks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const gate = await requireApiRole();
  if (gate.response) return gate.response;
  const { session } = gate;

  const body = await request.json().catch(() => null);
  const parsed = projectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      client: data.client ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      status: data.status,
      budgetPlanned: data.budgetPlanned ?? null,
      budgetSpent: data.budgetSpent ?? null,
      ownerId: session.sub,
    },
  });

  await logActivity({
    entityType: "Project",
    entityId: project.id,
    action: "created",
    userId: session.sub,
    metadata: { name: project.name },
  });

  return NextResponse.json({ project }, { status: 201 });
}
