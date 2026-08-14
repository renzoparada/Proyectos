import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Consolidated cross-project view — powers the top-level /risks page (the
// "vista de matriz de riesgos consolidada" from the spec).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const risks = await prisma.risk.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { severity: "desc" },
  });

  return NextResponse.json({ risks });
}
