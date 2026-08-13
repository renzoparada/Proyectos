import type { TaskStatus, TaskPriority } from "@/lib/task-meta";

export type TaskDependencyDTO = {
  id: string;
  dependsOnTaskId: string;
  type: string;
};

export type TaskDTO = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  progress: number;
  status: TaskStatus;
  priority: TaskPriority;
  isMilestone: boolean;
  assigneeId: string | null;
  assignee?: { id: string; name: string; email: string } | null;
  parentTaskId: string | null;
  dependsOn: TaskDependencyDTO[];
  createdAt: string;
  updatedAt: string;
};

export type UserOptionDTO = {
  id: string;
  name: string;
  email: string;
};
