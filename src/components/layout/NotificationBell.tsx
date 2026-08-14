"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Flag, ShieldAlert } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type NotificationItem = {
  id: string;
  name: string;
  date?: string;
  severity?: number;
  projectId: string;
  projectName: string;
};

type NotificationsData = {
  overdueTasks: NotificationItem[];
  criticalRisks: NotificationItem[];
  upcomingMilestones: NotificationItem[];
};

const POLL_MS = 120_000;

export function NotificationBell({
  onNavigate,
  align = "right",
}: {
  onNavigate?: () => void;
  /** Which side the dropdown panel hangs from. Use "left" when the bell sits
   * near the left edge of the viewport (e.g. the desktop sidebar), so the
   * panel opens into the visible content area instead of off-screen. */
  align?: "left" | "right";
}) {
  const [data, setData] = useState<NotificationsData | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/notifications");
      if (res.ok && !cancelled) setData(await res.json());
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const total = data
    ? data.overdueTasks.length + data.criticalRisks.length + data.upcomingMilestones.length
    : 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
        className="relative rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
      >
        <Bell size={18} />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface shadow-lg",
            align === "left" ? "left-0" : "right-0"
          )}
        >
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold text-foreground">Notificaciones</p>
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {!data ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Cargando…</p>
            ) : total === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Todo al día 🎉</p>
            ) : (
              <>
                <Section
                  title="Tareas vencidas"
                  icon={AlertTriangle}
                  tone="text-danger"
                  items={data.overdueTasks}
                  linkFor={(item) => `/projects/${item.projectId}/tasks`}
                  onNavigate={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  formatMeta={(item) => `venció ${formatDate(item.date)}`}
                />
                <Section
                  title="Riesgos críticos"
                  icon={ShieldAlert}
                  tone="text-danger"
                  items={data.criticalRisks}
                  linkFor={(item) => `/projects/${item.projectId}/risks`}
                  onNavigate={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  formatMeta={(item) => `severidad ${item.severity}`}
                />
                <Section
                  title="Hitos próximos (7 días)"
                  icon={Flag}
                  tone="text-accent"
                  items={data.upcomingMilestones}
                  linkFor={(item) => `/projects/${item.projectId}/tasks`}
                  onNavigate={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  formatMeta={(item) => formatDate(item.date)}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  tone,
  items,
  linkFor,
  onNavigate,
  formatMeta,
}: {
  title: string;
  icon: typeof AlertTriangle;
  tone: string;
  items: NotificationItem[];
  linkFor: (item: NotificationItem) => string;
  onNavigate: () => void;
  formatMeta: (item: NotificationItem) => string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="border-b border-border py-2 last:border-0">
      <p className="flex items-center gap-1.5 px-4 py-1 text-xs font-medium text-muted">
        <Icon size={12} className={cn("shrink-0", tone)} />
        {title}
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={linkFor(item)}
              onClick={onNavigate}
              className="block px-4 py-1.5 hover:bg-surface-hover"
            >
              <p className="truncate text-sm text-foreground">{item.name}</p>
              <p className="truncate text-xs text-muted">
                {item.projectName} · {formatMeta(item)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
