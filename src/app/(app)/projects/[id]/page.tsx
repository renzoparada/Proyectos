import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import type { ProjectDTO } from "@/types/project";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  if (!project) notFound();

  return <ProjectDetailView project={JSON.parse(JSON.stringify(project)) as ProjectDTO} />;
}
