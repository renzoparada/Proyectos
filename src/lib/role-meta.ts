export const ROLE_META: Record<
  "ADMIN" | "COLLABORATOR" | "READ_ONLY",
  { label: string; description: string; tone: "accent" | "neutral" | "warning" }
> = {
  ADMIN: {
    label: "Administrador",
    description: "Acceso total: gestiona proyectos, elimina y administra usuarios.",
    tone: "accent",
  },
  COLLABORATOR: {
    label: "Colaborador",
    description: "Puede crear y editar proyectos, tareas, riesgos y flujos.",
    tone: "neutral",
  },
  READ_ONLY: {
    label: "Solo lectura",
    description: "Puede ver todo, pero no puede crear ni modificar nada.",
    tone: "warning",
  },
};
