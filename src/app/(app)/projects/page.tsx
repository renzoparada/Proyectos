import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectsView } from "@/components/projects/ProjectsView";
import type { ProjectDTO } from "@/types/project";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await requireSession();
  const projects = await prisma.project.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, risks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <ProjectsView
      initialProjects={JSON.parse(JSON.stringify(projects)) as ProjectDTO[]}
      currentRole={session.role}
    />
  );
}
