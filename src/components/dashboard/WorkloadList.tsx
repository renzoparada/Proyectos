type WorkloadRow = { userId: string; name: string; count: number };

export function WorkloadList({ workload }: { workload: WorkloadRow[] }) {
  if (workload.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Sin tareas asignadas activas.</p>;
  }

  const max = Math.max(...workload.map((w) => w.count));

  return (
    <ul className="flex flex-col gap-2.5">
      {workload.map((w) => (
        <li key={w.userId}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{w.name}</span>
            <span className="text-muted">{w.count} tarea(s)</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${max ? (w.count / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
