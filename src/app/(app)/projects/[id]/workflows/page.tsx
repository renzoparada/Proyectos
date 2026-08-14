import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkflowsView } from "@/components/workflows/WorkflowsView";
import type { WorkflowSummaryDTO } from "@/types/workflow";

export const dynamic = "force-dynamic";

export default async function ProjectWorkflowsPage(props: PageProps<"/projects/[id]/workflows">) {
  const { id } = await props.params;

  const [project, workflows, projects] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.workflow.findMany({
      where: { projectId: id },
      include: { project: { select: { id: true, name: true } }, _count: { select: { nodes: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();

  const initialWorkflows = workflows.map((w) => ({ ...w, nodeCount: w._count.nodes }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/projects/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> {project.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Flujos — {project.name}</h1>
        <p className="text-sm text-muted">
          Procesos operativos de este proyecto. También puedes reutilizar plantillas desde{" "}
          <Link href="/workflows" className="text-accent hover:underline">
            todos los flujos
          </Link>
          .
        </p>
      </div>

      <WorkflowsView
        initialWorkflows={JSON.parse(JSON.stringify(initialWorkflows)) as WorkflowSummaryDTO[]}
        projects={projects}
        fixedProjectId={id}
        fetchUrl={`/api/workflows?projectId=${id}`}
      />
    </div>
  );
}
