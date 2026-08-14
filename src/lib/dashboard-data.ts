import "server-only";

import { startOfQuarter, startOfMonth, subMonths, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { computeHealthScore, type HealthResult } from "@/lib/health-score";
import { PROJECT_STATUSES } from "@/lib/validations/project";

const ACTIVE_STATUSES = ["PLANNING", "IN_PROGRESS", "ON_HOLD"] as const;

export type ProjectHealth = {
  id: string;
  name: string;
  status: string;
  ownerName: string | null;
  avgProgress: number | null;
  overdueTasks: number;
  highSeverityOpenRisks: number;
  health: HealthResult;
};

export async function getDashboardData() {
  const today = new Date();
  const quarterStart = startOfQuarter(today);
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    allProjects,
    activeProjects,
    completedThisQuarter,
    users,
    upcomingMilestonesRaw,
    topRisksRaw,
    workloadRaw,
    budgetProjects,
    riskCreatedDates,
    recentActivity,
  ] = await Promise.all([
    prisma.project.findMany({ select: { id: true, status: true } }),
    prisma.project.findMany({
      where: { status: { in: [...ACTIVE_STATUSES] } },
      include: { owner: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.count({
      where: { status: "COMPLETED", updatedAt: { gte: quarterStart } },
    }),
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.task.findMany({
      where: { isMilestone: true, startDate: { gte: today, lte: in30Days } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
    prisma.risk.findMany({
      where: { status: { notIn: ["MITIGATED", "CLOSED"] } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { severity: "desc" },
      take: 8,
    }),
    prisma.task.groupBy({
      by: ["assigneeId"],
      _count: { _all: true },
      where: { status: { not: "DONE" }, assigneeId: { not: null } },
    }),
    prisma.project.findMany({
      where: { OR: [{ budgetPlanned: { not: null } }, { budgetSpent: { not: null } }] },
      select: { id: true, name: true, budgetPlanned: true, budgetSpent: true },
    }),
    prisma.risk.findMany({ select: { createdAt: true } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const activeIds = activeProjects.map((p) => p.id);

  const [progressAgg, overdueAgg, riskAgg] = await Promise.all([
    prisma.task.groupBy({
      by: ["projectId"],
      _avg: { progress: true },
      where: { projectId: { in: activeIds } },
    }),
    prisma.task.groupBy({
      by: ["projectId"],
      _count: { _all: true },
      where: { projectId: { in: activeIds }, status: { not: "DONE" }, endDate: { lt: today } },
    }),
    prisma.risk.groupBy({
      by: ["projectId"],
      _count: { _all: true },
      where: {
        projectId: { in: activeIds },
        severity: { gte: 10 },
        status: { notIn: ["MITIGATED", "CLOSED"] },
      },
    }),
  ]);

  const progressByProject = new Map(progressAgg.map((r) => [r.projectId, r._avg.progress]));
  const overdueByProject = new Map(overdueAgg.map((r) => [r.projectId, r._count._all]));
  const riskByProject = new Map(riskAgg.map((r) => [r.projectId, r._count._all]));

  const projectHealths: ProjectHealth[] = activeProjects.map((p) => {
    const avgProgress = progressByProject.get(p.id) ?? null;
    const overdueTasks = overdueByProject.get(p.id) ?? 0;
    const highSeverityOpenRisks = riskByProject.get(p.id) ?? 0;

    let timeElapsedPct: number | null = null;
    if (p.startDate && p.endDate) {
      const total = p.endDate.getTime() - p.startDate.getTime();
      if (total > 0) {
        timeElapsedPct = Math.min(
          100,
          Math.max(0, ((today.getTime() - p.startDate.getTime()) / total) * 100)
        );
      }
    }

    const health = computeHealthScore({ avgProgress, timeElapsedPct, overdueTasks, highSeverityOpenRisks });

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      ownerName: p.owner?.name ?? null,
      avgProgress,
      overdueTasks,
      highSeverityOpenRisks,
      health,
    };
  });

  const atRiskCount = projectHealths.filter((p) => p.health.status !== "GREEN").length;
  const overdueProjectsCount = projectHealths.filter((p) => p.overdueTasks > 0).length;
  const inProgressCount = allProjects.filter((p) => p.status === "IN_PROGRESS").length;

  const statusCounts = PROJECT_STATUSES.reduce<Record<string, number>>((acc, status) => {
    acc[status] = allProjects.filter((p) => p.status === status).length;
    return acc;
  }, {});

  const userNameById = new Map(users.map((u) => [u.id, u.name]));
  const workload = workloadRaw
    .map((w) => ({
      userId: w.assigneeId as string,
      name: userNameById.get(w.assigneeId as string) ?? "Desconocido",
      count: w._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  // Bucket risks created per month for the last 6 months (inclusive of this one).
  const monthBuckets: { key: string; label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = startOfMonth(subMonths(today, i));
    monthBuckets.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM"), count: 0 });
  }
  const bucketByKey = new Map(monthBuckets.map((b) => [b.key, b]));
  for (const r of riskCreatedDates) {
    const key = format(startOfMonth(r.createdAt), "yyyy-MM");
    const bucket = bucketByKey.get(key);
    if (bucket) bucket.count += 1;
  }

  const overallAvgProgress = progressAgg.length
    ? Math.round(
        progressAgg.reduce((sum, r) => sum + (r._avg.progress ?? 0), 0) / progressAgg.length
      )
    : null;

  return {
    stats: {
      activeCount: inProgressCount,
      atRiskCount,
      overdueProjectsCount,
      completedThisQuarter,
    },
    projectHealths,
    statusCounts,
    upcomingMilestones: upcomingMilestonesRaw,
    topRisks: topRisksRaw,
    workload,
    budgetProjects,
    riskTrend: monthBuckets,
    overallAvgProgress,
    recentActivity,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
