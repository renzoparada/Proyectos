import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planificación",
  IN_PROGRESS: "En curso",
  ON_HOLD: "En pausa",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export default async function DashboardPage() {
  const [total, byStatus, recentProjects, recentActivity] = await Promise.all([
    prisma.project.count(),
    prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { owner: { select: { name: true } } },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const statusCount = (status: string) =>
    byStatus.find((s) => s.status === status)?._count._all ?? 0;

  const activeCount = statusCount("IN_PROGRESS");
  const onHoldCount = statusCount("ON_HOLD");
  const completedCount = statusCount("COMPLETED");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">
          Vista general de tus proyectos. El dashboard ejecutivo completo (salud de proyecto,
          riesgos y presupuesto) llega en la Fase 5.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Proyectos totales" value={total} />
        <StatCard label="En curso" value={activeCount} tone="accent" />
        <StatCard label="En pausa" value={onHoldCount} tone="warning" />
        <StatCard label="Completados" value={completedCount} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Proyectos recientes</CardTitle>
            <Link href="/projects" className="text-xs font-medium text-accent hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="divide-y divide-border">
                {recentProjects.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${p.id}`}
                        className="truncate text-sm font-medium text-foreground hover:text-accent"
                      >
                        {p.name}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {p.client ?? "Sin cliente"} · Responsable: {p.owner?.name ?? "—"}
                      </p>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por estado</CardTitle>
          </CardHeader>
          <CardContent>
            {total === 0 ? (
              <EmptyState />
            ) : (
              <ul className="space-y-2">
                {Object.entries(STATUS_LABELS).map(([status, label]) => {
                  const count = statusCount(status);
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  return (
                    <li key={status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-foreground">{label}</span>
                        <span className="text-muted">{count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <Badge tone="neutral" className="mt-0.5 shrink-0">
                      {a.entityType}
                    </Badge>
                    <span className="text-foreground">
                      {a.user?.name ?? "Alguien"}{" "}
                      <span className="text-muted">{actionLabel(a.action)}</span>{" "}
                      {typeof a.metadata === "object" &&
                      a.metadata &&
                      "name" in a.metadata
                        ? String((a.metadata as { name?: unknown }).name)
                        : ""}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-muted">
                      {formatDate(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function actionLabel(action: string) {
  switch (action) {
    case "created":
      return "creó";
    case "updated":
      return "actualizó";
    case "status_changed":
      return "cambió el estado de";
    case "deleted":
      return "eliminó";
    default:
      return action;
  }
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "accent" | "warning" | "success";
}) {
  const toneText: Record<string, string> = {
    neutral: "text-foreground",
    accent: "text-accent",
    warning: "text-warning",
    success: "text-success",
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold ${toneText[tone]}`}>{value}</p>
    </Card>
  );
}

function EmptyState() {
  return <p className="py-6 text-center text-sm text-muted">Todavía no hay datos.</p>;
}
