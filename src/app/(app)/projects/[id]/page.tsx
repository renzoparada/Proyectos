import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import type { ProjectDTO } from "@/types/project";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;

  const [project, taskTotal, overdueTotal, riskTotal, highSeverityTotal, workflowTotal] =
    await Promise.all([
      prisma.project.findUnique({
        where: { id },
        include: { owner: { select: { id: true, name: true, email: true } } },
      }),
      prisma.task.count({ where: { projectId: id } }),
      prisma.task.count({
        where: { projectId: id, status: { not: "DONE" }, endDate: { lt: new Date() } },
      }),
      prisma.risk.count({ where: { projectId: id } }),
      prisma.risk.count({ where: { projectId: id, severity: { gte: 10 } } }),
      prisma.workflow.count({ where: { projectId: id } }),
    ]);

  if (!project) notFound();

  return (
    <ProjectDetailView
      project={JSON.parse(JSON.stringify(project)) as ProjectDTO}
      taskStats={{ total: taskTotal, overdue: overdueTotal }}
      riskStats={{ total: riskTotal, highSeverity: highSeverityTotal }}
      workflowCount={workflowTotal}
    />
  );
}
