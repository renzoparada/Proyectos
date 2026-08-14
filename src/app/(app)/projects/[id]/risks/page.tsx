import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RisksView } from "@/components/risks/RisksView";
import type { RiskDTO } from "@/types/risk";
import type { UserOptionDTO } from "@/types/task";

export const dynamic = "force-dynamic";

const riskInclude = {
  owner: { select: { id: true, name: true, email: true } },
} as const;

export default async function ProjectRisksPage(props: PageProps<"/projects/[id]/risks">) {
  const { id } = await props.params;

  const [project, risks, users] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.risk.findMany({
      where: { projectId: id },
      include: riskInclude,
      orderBy: { severity: "desc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/projects/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> {project.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Riesgos — {project.name}</h1>
        <p className="text-sm text-muted">Matriz de calor y registro de riesgos del proyecto.</p>
      </div>

      <RisksView
        projectId={id}
        initialRisks={JSON.parse(JSON.stringify(risks)) as RiskDTO[]}
        users={JSON.parse(JSON.stringify(users)) as UserOptionDTO[]}
      />
    </div>
  );
}
