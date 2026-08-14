import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatDate } from "@/lib/utils";
import { ProjectHealthGrid } from "@/components/dashboard/ProjectHealthGrid";
import { UpcomingMilestones } from "@/components/dashboard/UpcomingMilestones";
import { TopRisksList } from "@/components/dashboard/TopRisksList";
import { WorkloadList } from "@/components/dashboard/WorkloadList";
import { StatusDonutChart } from "@/components/dashboard/StatusDonutChart";
import { ProgressBarChart } from "@/components/dashboard/ProgressBarChart";
import { RiskTrendChart } from "@/components/dashboard/RiskTrendChart";
import { BudgetChart } from "@/components/dashboard/BudgetChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { stats } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Dashboard ejecutivo</h1>
        <p className="text-sm text-muted">
          Lo más importante de todos tus proyectos, en una sola pantalla.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Proyectos activos" value={stats.activeCount} />
        <StatCard label="En riesgo" value={stats.atRiskCount} tone="warning" />
        <StatCard label="Atrasados" value={stats.overdueProjectsCount} tone="danger" />
        <StatCard label="Completados este trimestre" value={stats.completedThisQuarter} tone="success" />
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Salud de proyectos activos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectHealthGrid projects={data.projectHealths} />
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos hitos (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingMilestones
              milestones={data.upcomingMilestones.map((m) => ({
                id: m.id,
                name: m.name,
                startDate: m.startDate,
                project: m.project,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top riesgos activos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopRisksList
              risks={data.topRisks.map((r) => ({
                id: r.id,
                name: r.name,
                severity: r.severity,
                project: r.project,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de proyectos por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonutChart counts={data.statusCounts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carga de trabajo por responsable</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkloadList workload={data.workload} />
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Avance por proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBarChart projects={data.projectHealths} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riesgos creados por mes</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskTrendChart data={data.riskTrend} />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Presupuesto: gastado vs. planeado</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetChart projects={data.budgetProjects} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <Badge tone="neutral" className="mt-0.5 shrink-0">
                    {a.entityType}
                  </Badge>
                  <span className="text-foreground">
                    {a.user?.name ?? "Alguien"} <span className="text-muted">{actionLabel(a.action)}</span>{" "}
                    {typeof a.metadata === "object" && a.metadata && "name" in a.metadata
                      ? String((a.metadata as { name?: unknown }).name)
                      : ""}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-muted">{formatDate(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
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
    case "rescheduled":
      return "reprogramó";
    case "deleted":
      return "eliminó";
    case "duplicated":
      return "duplicó";
    case "versioned":
      return "guardó una nueva versión de";
    case "graph_saved":
      return "guardó cambios en";
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
  tone?: "neutral" | "accent" | "warning" | "success" | "danger";
}) {
  const toneText: Record<string, string> = {
    neutral: "text-foreground",
    accent: "text-accent",
    warning: "text-warning",
    success: "text-success",
    danger: "text-danger",
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
