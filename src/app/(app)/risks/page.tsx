import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RisksConsolidatedView } from "@/components/risks/RisksConsolidatedView";
import type { RiskDTO } from "@/types/risk";
import type { UserOptionDTO } from "@/types/task";

export const dynamic = "force-dynamic";

const riskInclude = {
  owner: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
} as const;

export default async function RisksPage() {
  const session = await requireSession();
  const [risks, users, projects] = await Promise.all([
    prisma.risk.findMany({ include: riskInclude, orderBy: { severity: "desc" } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Riesgos</h1>
        <p className="text-sm text-muted">
          Matriz de calor consolidada de todos los proyectos — dónde están los focos rojos del negocio.
        </p>
      </div>

      <RisksConsolidatedView
        initialRisks={JSON.parse(JSON.stringify(risks)) as RiskDTO[]}
        users={JSON.parse(JSON.stringify(users)) as UserOptionDTO[]}
        projects={projects}
        currentRole={session.role}
      />
    </div>
  );
}
