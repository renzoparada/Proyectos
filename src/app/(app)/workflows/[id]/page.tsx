import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkflowEditor } from "@/components/workflows/WorkflowEditor";
import type { WorkflowDTO, WorkflowSummaryDTO } from "@/types/workflow";

export const dynamic = "force-dynamic";

export default async function WorkflowEditorPage(props: PageProps<"/workflows/[id]">) {
  const { id } = await props.params;

  const [workflow, otherWorkflows, projects] = await Promise.all([
    prisma.workflow.findUnique({
      where: { id },
      include: {
        nodes: true,
        edges: true,
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.workflow.findMany({
      where: { id: { not: id } },
      select: { id: true, name: true, version: true, isTemplate: true, projectId: true, createdAt: true, updatedAt: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!workflow) notFound();

  return (
    <div className="h-full">
      <WorkflowEditor
        workflow={JSON.parse(JSON.stringify(workflow)) as WorkflowDTO}
        otherWorkflows={JSON.parse(JSON.stringify(otherWorkflows)) as WorkflowSummaryDTO[]}
        projects={projects}
      />
    </div>
  );
}
