import type { ProjectStatus } from "@/lib/project-status";

export type ProjectDTO = {
  id: string;
  name: string;
  description: string | null;
  client: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  budgetPlanned: number | null;
  budgetSpent: number | null;
  ownerId: string | null;
  owner?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number; risks: number; workflows?: number };
};
