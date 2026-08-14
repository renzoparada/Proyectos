import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Computed, no-infrastructure notifications: overdue tasks, high-severity
// open risks, and milestones coming up in the next 7 days. No email/push —
// just what needs attention, surfaced in-app for whoever is looking.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const today = new Date();
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [overdueTasks, criticalRisks, upcomingMilestones] = await Promise.all([
    prisma.task.findMany({
      where: { status: { not: "DONE" }, endDate: { lt: today } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { endDate: "asc" },
      take: 8,
    }),
    prisma.risk.findMany({
      where: { severity: { gte: 15 }, status: { notIn: ["MITIGATED", "CLOSED"] } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { severity: "desc" },
      take: 8,
    }),
    prisma.task.findMany({
      where: { isMilestone: true, startDate: { gte: today, lte: in7Days } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { startDate: "asc" },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    overdueTasks: overdueTasks.map((t) => ({
      id: t.id,
      name: t.name,
      date: t.endDate,
      projectId: t.project.id,
      projectName: t.project.name,
    })),
    criticalRisks: criticalRisks.map((r) => ({
      id: r.id,
      name: r.name,
      severity: r.severity,
      projectId: r.project.id,
      projectName: r.project.name,
    })),
    upcomingMilestones: upcomingMilestones.map((t) => ({
      id: t.id,
      name: t.name,
      date: t.startDate,
      projectId: t.project.id,
      projectName: t.project.name,
    })),
  });
}
