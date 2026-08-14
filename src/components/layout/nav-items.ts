import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FolderKanban, ShieldAlert, Workflow } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoonPhase?: string;
};

// Gantt/Tareas is per-project (see /projects/[id]/tasks), so it doesn't get
// its own top-level nav entry — only cross-project modules do. Risks and
// Flujos have both: a per-project view AND this consolidated/catalog view.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Proyectos", href: "/projects", icon: FolderKanban },
  { label: "Riesgos", href: "/risks", icon: ShieldAlert },
  { label: "Flujos", href: "/workflows", icon: Workflow },
];
