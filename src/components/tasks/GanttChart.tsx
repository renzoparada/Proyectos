"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addDays,
  buildTimelineDays,
  dayLabel,
  diffInDays,
  groupDaysByMonth,
  isOverdue,
  isSameDay,
  isWeekend,
  startOfDay,
  weekdayLabel,
} from "@/lib/gantt-dates";
import { TASK_PRIORITY_META } from "@/lib/task-meta";
import type { TaskDTO } from "@/types/task";

const DAY_WIDTH = 34;
const ROW_HEIGHT = 44;
const LEFT_PANEL_WIDTH = 260;

type DragMode = "move" | "resize-start" | "resize-end";

type DragState = {
  taskId: string;
  mode: DragMode;
  startClientX: number;
  originStart: Date;
  originEnd: Date;
};

type PreviewMap = Record<string, { startDate: Date; endDate: Date }>;

export function GanttChart({
  tasks,
  onOpenTask,
  onDatesChange,
}: {
  tasks: TaskDTO[];
  onOpenTask: (task: TaskDTO) => void;
  onDatesChange: (taskId: string, startDate: Date, endDate: Date) => Promise<void>;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<PreviewMap>({});
  const lastDeltaRef = useRef(0);
  const dragMovedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = startOfDay(new Date());

  const { rangeStart, days, totalWidth } = useMemo(() => {
    const allDates = tasks.flatMap((t) => [new Date(t.startDate), new Date(t.endDate)]);
    const min = allDates.length
      ? new Date(Math.min(...allDates.map((d) => d.getTime()), today.getTime()))
      : today;
    const max = allDates.length
      ? new Date(Math.max(...allDates.map((d) => d.getTime()), today.getTime()))
      : today;
    const rangeStart = addDays(min, -3);
    const rangeEnd = addDays(max, 10);
    const days = buildTimelineDays(rangeStart, rangeEnd);
    return { rangeStart, days, totalWidth: days.length * DAY_WIDTH };
  }, [tasks, today]);

  const monthGroups = useMemo(() => groupDaysByMonth(days), [days]);
  const rowIndexById = useMemo(() => new Map(tasks.map((t, i) => [t.id, i])), [tasks]);

  // Default the horizontal scroll to "today" (offset a bit to the left) so a
  // wide timeline doesn't open on a blank stretch of past or future days.
  // Intentionally runs once on mount only — re-running on every recompute of
  // `rangeStart` (a new Date each render) would fight the user's own
  // scrolling/dragging after the first paint.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const todayX = diffInDays(today, rangeStart) * DAY_WIDTH;
    el.scrollLeft = Math.max(0, todayX - LEFT_PANEL_WIDTH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function bounds(task: TaskDTO) {
    const p = preview[task.id];
    return p ?? { startDate: new Date(task.startDate), endDate: new Date(task.endDate) };
  }

  function toX(date: Date) {
    return diffInDays(date, rangeStart) * DAY_WIDTH;
  }

  function startDrag(e: React.PointerEvent, task: TaskDTO, mode: DragMode) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    lastDeltaRef.current = 0;
    dragMovedRef.current = false;
    setDrag({
      taskId: task.id,
      mode,
      startClientX: e.clientX,
      originStart: startOfDay(task.startDate),
      originEnd: startOfDay(task.endDate),
    });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const deltaPx = e.clientX - drag.startClientX;
    const deltaDays = Math.round(deltaPx / DAY_WIDTH);
    if (deltaDays === lastDeltaRef.current) return;
    lastDeltaRef.current = deltaDays;
    dragMovedRef.current = true;

    let newStart = drag.originStart;
    let newEnd = drag.originEnd;
    if (drag.mode === "move") {
      newStart = addDays(drag.originStart, deltaDays);
      newEnd = addDays(drag.originEnd, deltaDays);
    } else if (drag.mode === "resize-start") {
      newStart = addDays(drag.originStart, deltaDays);
      if (newStart > drag.originEnd) newStart = drag.originEnd;
    } else {
      newEnd = addDays(drag.originEnd, deltaDays);
      if (newEnd < drag.originStart) newEnd = drag.originStart;
    }
    setPreview((p) => ({ ...p, [drag.taskId]: { startDate: newStart, endDate: newEnd } }));
  }

  // The bars are draggable AND clickable (to open the edit modal); a real
  // drag still ends with a "click" event on the same element, so swallow
  // that one click instead of also opening the modal right after a drag.
  function handleBarClick(task: TaskDTO) {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    onOpenTask(task);
  }

  function handlePointerUp() {
    if (!drag) return;
    const { taskId } = drag;
    const originalTask = tasks.find((t) => t.id === taskId);
    const p = preview[taskId];
    setDrag(null);
    if (!p || !originalTask) return;

    const changed =
      diffInDays(p.startDate, originalTask.startDate) !== 0 ||
      diffInDays(p.endDate, originalTask.endDate) !== 0;

    if (!changed) {
      setPreview((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      return;
    }

    onDatesChange(taskId, p.startDate, p.endDate).finally(() => {
      setPreview((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface py-16 text-center">
        <p className="text-sm font-medium text-foreground">No hay tareas todavía</p>
        <p className="text-sm text-muted">Crea la primera tarea para ver el Gantt.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div ref={scrollRef} className="overflow-x-auto scrollbar-thin">
        <div style={{ minWidth: LEFT_PANEL_WIDTH + totalWidth }}>
          {/* Header */}
          <div className="flex border-b border-border">
            <div
              className="sticky left-0 z-10 flex shrink-0 items-end border-r border-border bg-surface px-3 pb-2 pt-3 text-xs font-medium text-muted"
              style={{ width: LEFT_PANEL_WIDTH }}
            >
              Tarea
            </div>
            <div style={{ width: totalWidth }}>
              <div className="flex h-6">
                {monthGroups.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center border-l border-border px-2 text-[11px] font-medium text-muted"
                    style={{ width: g.span * DAY_WIDTH }}
                  >
                    {g.label}
                  </div>
                ))}
              </div>
              <div className="flex h-8 border-t border-border">
                {days.map((d, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col items-center justify-center border-l border-border text-[10px] leading-tight",
                      isWeekend(d) && "bg-surface-hover",
                      isSameDay(d, today) && "bg-accent/10"
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className="text-muted">{weekdayLabel(d).slice(0, 1)}</span>
                    <span className={cn("font-medium", isSameDay(d, today) ? "text-accent" : "text-foreground")}>
                      {dayLabel(d)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex">
            <div
              className="sticky left-0 z-10 shrink-0 border-r border-border bg-surface"
              style={{ width: LEFT_PANEL_WIDTH }}
            >
              {tasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onOpenTask(task)}
                    className="flex w-full flex-col justify-center gap-0.5 border-b border-border px-3 text-left hover:bg-surface-hover"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <span className="flex items-center gap-1.5 truncate text-xs font-medium text-foreground">
                      {overdue && <AlertTriangle size={12} className="shrink-0 text-danger" />}
                      <span className="truncate">{task.name}</span>
                    </span>
                    <span className="truncate text-[11px] text-muted">
                      {task.assignee?.name ?? "Sin asignar"} · {task.progress}%
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="relative"
              style={{ width: totalWidth, height: tasks.length * ROW_HEIGHT }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* weekend stripes */}
              {days.map(
                (d, i) =>
                  isWeekend(d) && (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 bg-surface-hover/60"
                      style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                    />
                  )
              )}
              {/* today line */}
              <div
                className="absolute top-0 bottom-0 z-10 w-px bg-accent"
                style={{ left: toX(today) }}
              />

              {/* dependency connectors */}
              <svg
                className="pointer-events-none absolute inset-0"
                width={totalWidth}
                height={tasks.length * ROW_HEIGHT}
              >
                <defs>
                  <marker
                    id="gantt-arrow"
                    viewBox="0 0 8 8"
                    refX="7"
                    refY="4"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M0,0 L8,4 L0,8 z" style={{ fill: "var(--muted)" }} />
                  </marker>
                </defs>
                {tasks.map((task, idx) =>
                  task.dependsOn.map((dep) => {
                    const predIdx = rowIndexById.get(dep.dependsOnTaskId);
                    if (predIdx === undefined) return null;
                    const pred = tasks[predIdx];
                    const predBounds = bounds(pred);
                    const succBounds = bounds(task);
                    const predEndX = toX(addDays(predBounds.endDate, 1));
                    const predY = predIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                    const succStartX = toX(succBounds.startDate);
                    const succY = idx * ROW_HEIGHT + ROW_HEIGHT / 2;
                    const midX = Math.max(predEndX + 10, succStartX - 10);
                    const d = `M ${predEndX} ${predY} L ${midX} ${predY} L ${midX} ${succY} L ${succStartX} ${succY}`;
                    return (
                      <path
                        key={`${task.id}-${dep.id}`}
                        d={d}
                        fill="none"
                        markerEnd="url(#gantt-arrow)"
                        style={{ stroke: "var(--muted)", strokeWidth: 1.5, opacity: 0.7 }}
                      />
                    );
                  })
                )}
              </svg>

              {/* bars */}
              {tasks.map((task, idx) => {
                const b = bounds(task);
                const overdue = isOverdue(task);
                const priorityTone = TASK_PRIORITY_META[task.priority].tone;
                const top = idx * ROW_HEIGHT;

                if (task.isMilestone) {
                  const x = toX(b.startDate) + DAY_WIDTH / 2;
                  return (
                    <div
                      key={task.id}
                      role="button"
                      tabIndex={0}
                      onPointerDown={(e) => startDrag(e, task, "move")}
                      onClick={() => handleBarClick(task)}
                      title={`${task.name} (hito)`}
                      className={cn(
                        "absolute flex items-center justify-center rounded-[3px] border-2 bg-surface shadow-sm",
                        overdue ? "border-danger" : "border-accent"
                      )}
                      style={{
                        top: top + ROW_HEIGHT / 2 - 8,
                        left: x - 8,
                        width: 16,
                        height: 16,
                        transform: "rotate(45deg)",
                        touchAction: "none",
                        cursor: "grab",
                      }}
                    />
                  );
                }

                const left = toX(b.startDate);
                const width = Math.max(DAY_WIDTH, toX(addDays(b.endDate, 1)) - left);

                return (
                  <div
                    key={task.id}
                    className="group absolute flex items-center"
                    style={{ top, left, width, height: ROW_HEIGHT }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleBarClick(task)}
                      onPointerDown={(e) => startDrag(e, task, "move")}
                      title={`${task.name} — ${task.progress}%`}
                      className={cn(
                        "relative flex h-6 w-full items-center overflow-hidden rounded-md border shadow-sm",
                        overdue
                          ? "border-danger/60 bg-danger-bg"
                          : priorityTone === "danger"
                            ? "border-danger/40 bg-accent/15"
                            : "border-accent/30 bg-accent/15"
                      )}
                      style={{ touchAction: "none", cursor: "grab" }}
                    >
                      <div
                        className={cn("h-full", overdue ? "bg-danger/50" : "bg-accent/60")}
                        style={{ width: `${task.progress}%` }}
                      />
                      <span className="absolute left-2 truncate text-[11px] font-medium text-foreground">
                        {task.name}
                      </span>
                      {/* resize handles */}
                      <div
                        onPointerDown={(e) => startDrag(e, task, "resize-start")}
                        className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize opacity-0 hover:opacity-100 group-hover:bg-accent/40"
                      />
                      <div
                        onPointerDown={(e) => startDrag(e, task, "resize-end")}
                        className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize opacity-0 hover:opacity-100 group-hover:bg-accent/40"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border px-3 py-2 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent/60" /> Tarea
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] border-2 border-accent bg-surface" /> Hito
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-danger/50" /> Vencida
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-accent" /> Hoy
        </span>
        <span>Arrastra una barra para mover fechas, o su borde para ajustar la duración.</span>
      </div>
    </div>
  );
}
