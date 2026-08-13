import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FolderKanban, GanttChart, ShieldAlert, Workflow } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoonPhase?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Proyectos", href: "/projects", icon: FolderKanban },
  { label: "Gantt", href: "/gantt", icon: GanttChart, comingSoonPhase: "Fase 2" },
  { label: "Riesgos", href: "/risks", icon: ShieldAlert, comingSoonPhase: "Fase 3" },
  { label: "Flujos", href: "/workflows", icon: Workflow, comingSoonPhase: "Fase 4" },
];
