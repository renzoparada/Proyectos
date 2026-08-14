import { prisma } from "@/lib/prisma";
import { WorkflowsView } from "@/components/workflows/WorkflowsView";
import type { WorkflowSummaryDTO } from "@/types/workflow";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const [workflows, projects] = await Promise.all([
    prisma.workflow.findMany({
      include: { project: { select: { id: true, name: true } }, _count: { select: { nodes: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const initialWorkflows = workflows.map((w) => ({ ...w, nodeCount: w._count.nodes }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Flujos</h1>
        <p className="text-sm text-muted">
          Documentación visual de procesos — plantillas reutilizables o flujos de un proyecto.
        </p>
      </div>

      <WorkflowsView
        initialWorkflows={JSON.parse(JSON.stringify(initialWorkflows)) as WorkflowSummaryDTO[]}
        projects={projects}
        fetchUrl="/api/workflows"
      />
    </div>
  );
}
