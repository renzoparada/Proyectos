# Command Center — CRM / Project Management personal

Plataforma centralizada para gestionar múltiples proyectos: cronogramas, riesgos,
flujos operativos y un dashboard ejecutivo. Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md)
para el detalle de arquitectura y el plan de fases.

**Estado actual: Fase 2 — Tareas y Gantt (completa).** CRUD de proyectos, login,
modelo de datos completo, layout base, y ahora tareas con vista Gantt
(drag/resize), Lista y Kanban por proyecto. Fases 3-6 (Riesgos, Flujos,
Dashboard ejecutivo, pulido) están planificadas — ver el roadmap en
`ARCHITECTURE.md`.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack) + TypeScript + React 19
- **Estilos**: Tailwind CSS v4
- **Base de datos**: PostgreSQL vía Prisma ORM 7 (driver adapter `@prisma/adapter-pg`)
- **Auth**: sesión propia con JWT firmado (`jose`) en cookie httpOnly + `bcryptjs`
  para contraseñas — pensado para migrar a multi-usuario/roles sin rehacer el modelo
- **Iconos**: lucide-react

> **Nota sobre versiones**: este proyecto usa Next.js 16, que renombró
> `middleware.ts` a `proxy.ts` (ver `src/proxy.ts`) y cambió varias convenciones
> respecto a versiones anteriores. Antes de tocar rutas o config revisa
> `node_modules/next/dist/docs/` — Next.js genera esa documentación localmente
> porque el propio framework advierte que difiere de lo que la mayoría de
> modelos/tutoriales conocen. Prisma 7 también cambió: usa el generador
> `prisma-client` (cliente generado en `src/generated/prisma`, gitignored) y
> requiere un *driver adapter* explícito en vez de conectar solo. Ver
> `src/lib/prisma.ts`.

## Setup local

1. **Dependencias**: `pnpm install`
2. **Base de datos**: necesitas un Postgres corriendo. Copia `.env.example` a
   `.env` y ajusta `DATABASE_URL`, `AUTH_SECRET` (genera uno con
   `openssl rand -base64 48`) y las credenciales del usuario semilla
   (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME`).
3. **Migraciones**: `pnpm db:migrate` (crea las tablas a partir de
   `prisma/schema.prisma`)
4. **Usuario admin**: `pnpm db:seed` (Fase 1 es single-user; esto crea/actualiza
   el único usuario admin con las credenciales del `.env`)
5. **Levantar la app**: `pnpm dev` → http://localhost:3000

Scripts útiles:

- `pnpm db:studio` — abre Prisma Studio para inspeccionar datos
- `pnpm db:generate` — regenera el cliente Prisma tras cambiar el schema
- `pnpm lint` / `pnpm exec tsc --noEmit` — chequeos de calidad
- `pnpm build` — build de producción

## Estructura del proyecto

```
prisma/
  schema.prisma        # modelo de datos completo (todas las fases)
  seed.ts               # crea el usuario admin inicial
src/
  app/
    (app)/              # rutas protegidas (requieren sesión), con Sidebar
      dashboard/
      projects/
        [id]/
          tasks/         # Gantt / Lista / Kanban del proyecto
    api/                # route handlers (REST-ish, JSON)
      auth/{login,logout,me}/
      users/
      projects/[id]/tasks/
      tasks/[id]/{dates,status}/
    login/               # única ruta pública
    layout.tsx           # layout raíz (fuentes, metadata)
    page.tsx             # redirige a /dashboard
    globals.css          # tokens de diseño (Tailwind v4 @theme)
  components/
    ui/                  # Button, Input, Card, Badge, Modal, etc. (genéricos)
    layout/              # Sidebar, AppShell, nav-items
    projects/            # componentes específicos del módulo Proyectos
    tasks/                # GanttChart, TaskListView, TaskKanbanView, TaskForm
  lib/
    prisma.ts            # cliente Prisma (driver adapter pg)
    auth.ts / session.ts # sesión JWT (session.ts es edge-safe, para proxy.ts)
    activity.ts           # helper para ActivityLog
    validations/          # esquemas zod
    gantt-dates.ts         # helpers de fecha puros para el Gantt (sin deps)
  types/                  # DTOs compartidos front/back
  generated/prisma/        # cliente Prisma generado (gitignored)
  proxy.ts                 # protección de rutas (reemplaza middleware.ts)
```

La idea de esta estructura es que cada módulo nuevo (Tareas/Gantt, Riesgos,
Flujos) agregue su propia carpeta bajo `app/(app)/`, `components/` y
`lib/validations/` sin tocar lo existente. El modelo de datos ya contempla esas
entidades (`Task`, `TaskDependency`, `Risk`, `Workflow`, `WorkflowNode`,
`WorkflowEdge`) para que las próximas fases sean migraciones aditivas.
