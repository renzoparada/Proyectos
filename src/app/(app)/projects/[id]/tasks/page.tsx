import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TasksView } from "@/components/tasks/TasksView";
import type { TaskDTO, UserOptionDTO } from "@/types/task";

export const dynamic = "force-dynamic";

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  dependsOn: { select: { id: true, dependsOnTaskId: true, type: true } },
} as const;

export default async function ProjectTasksPage(props: PageProps<"/projects/[id]/tasks">) {
  const { id } = await props.params;

  const [project, tasks, users] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.task.findMany({
      where: { projectId: id },
      include: taskInclude,
      orderBy: { startDate: "asc" },
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
        <h1 className="text-xl font-semibold text-foreground">Tareas — {project.name}</h1>
        <p className="text-sm text-muted">Gantt, lista y kanban sobre el mismo set de tareas.</p>
      </div>

      <TasksView
        projectId={id}
        initialTasks={JSON.parse(JSON.stringify(tasks)) as TaskDTO[]}
        users={JSON.parse(JSON.stringify(users)) as UserOptionDTO[]}
      />
    </div>
  );
}
