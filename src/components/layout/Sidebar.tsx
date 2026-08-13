"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/lib/session";

export function Sidebar({
  user,
  onNavigate,
}: {
  user: SessionPayload;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
          C
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-foreground">Command Center</p>
          <p className="text-xs leading-tight text-muted">Panel de proyectos</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const disabled = Boolean(item.comingSoonPhase);
          if (disabled) {
            return (
              <div
                key={item.href}
                title={`Disponible en ${item.comingSoonPhase}`}
                className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-muted/60"
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={17} />
                  {item.label}
                </span>
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  {item.comingSoonPhase}
                </span>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-foreground/80 hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-foreground">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-danger"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
