# Arquitectura y plan de construcción

## 1. Arquitectura (confirmada, con ajustes sobre la propuesta original)

| Capa | Elección | Notas |
|---|---|---|
| Frontend + Backend | Next.js 16 (App Router), un solo proyecto | Server Components para lectura, Route Handlers (`/api/*`) para mutaciones desde componentes cliente. Evita mantener dos apps separadas para un uso personal. |
| Lenguaje | TypeScript estricto | |
| Estilos | Tailwind CSS v4 | Tokens de color en `globals.css` (`@theme`), soporta modo oscuro por `prefers-color-scheme`. |
| Base de datos | PostgreSQL | Real, persistente, apta para relaciones (dependencias de tareas, riesgos, workflows). |
| ORM | Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) | Ver nota de versión abajo. |
| Auth | Sesión propia (JWT en cookie httpOnly, `jose` + `bcryptjs`) en vez de NextAuth | Ver justificación abajo. |
| Gráficos (Fase 5) | Recharts | A integrar en el dashboard ejecutivo. |
| Gantt (Fase 2) | **Construido a medida** (`src/components/tasks/GanttChart.tsx`) | Ver justificación abajo. |
| Diagramas de flujo (Fase 4) | React Flow | El schema (`Workflow`, `WorkflowNode`, `WorkflowEdge`) ya está listo para consumirlo. |
| Deploy sugerido | Vercel (app) + Postgres administrado (Neon/Supabase/RDS) | No configurado todavía; agregar cuando quieras desplegar. |

### Ajustes respecto a la propuesta original

- **Un solo framework fullstack (Next.js) en vez de "Next.js o Express aparte"**:
  simplifica el deploy y el desarrollo para un producto de un solo dueño/CEO.
- **Auth propia en vez de NextAuth.js**: este proyecto quedó fijado en Next.js 16
  (última versión estable al momento de crear el proyecto), y NextAuth/Auth.js no
  tiene todavía soporte confirmado y documentado para las convenciones nuevas de
  esa versión (p.ej. `proxy.ts` en lugar de `middleware.ts`). Para no depender de
  compatibilidad de una librería en beta con un framework recién salido, se
  implementó una sesión propia: JWT firmado en cookie httpOnly, contraseñas con
  bcrypt, y un `role` (`ADMIN` / `COLLABORATOR` / `READ_ONLY`) ya en el modelo de
  `User` para cuando se agregue multi-usuario. Migrar a NextAuth/Auth.js más
  adelante es un cambio acotado a `src/lib/auth.ts` y `src/proxy.ts` si en el
  futuro prefieres esa librería (por ejemplo para login social).
- **Modelo de datos completo desde la Fase 1**: `prisma/schema.prisma` ya incluye
  `Task`, `TaskDependency`, `Risk`, `Workflow`, `WorkflowNode`, `WorkflowEdge` y
  `ActivityLog`, aunque solo `Project` y `User` tienen UI todavía. Así las fases
  2-4 son features nuevas sobre tablas existentes, no migraciones que reordenan
  lo ya construido.
- **Gantt construido a medida en vez de `gantt-task-react`/`frappe-gantt`**:
  `gantt-task-react` solo declara compatibilidad con React 18 (este proyecto usa
  React 19) y está prácticamente sin mantenimiento; `frappe-gantt` es una
  librería vanilla-JS con su propio CSS, difícil de integrar de forma prolija
  con el sistema de diseño (tokens de `globals.css`, modo oscuro) y con el
  control fino que pide el spec (drag/resize, hitos, conectores de dependencia,
  indicador de vencidas). El componente propio (`GanttChart.tsx`) usa Pointer
  Events nativos para mover/redimensionar barras, y SVG para las líneas de
  dependencia — sin dependencias externas nuevas.

### Nota de versiones (importante para quien siga desarrollando)

El proyecto quedó en **Next.js 16** y **Prisma 7**, ambos con cambios de
convención relevantes:

- Next 16 renombró `middleware.ts` → `proxy.ts` (función exportada `proxy`, no
  `middleware`). El propio framework escribe un archivo `AGENTS.md` en la raíz
  recordando que hay que revisar `node_modules/next/dist/docs/` antes de asumir
  comportamiento de versiones anteriores.
- Prisma 7 cambió el generador por defecto a `prisma-client` (cliente generado a
  un directorio de salida — aquí `src/generated/prisma`, gitignored — en vez de
  vivir dentro de `node_modules/@prisma/client`) y requiere un *driver adapter*
  explícito (`@prisma/adapter-pg` en este caso) al instanciar `PrismaClient`, en
  vez de conectar automáticamente por `datasource url`. Las variables de entorno
  tampoco se cargan solas: `prisma.config.ts` importa `dotenv/config`.

## 2. Estructura de carpetas

Ver la sección "Estructura del proyecto" en `README.md`.

## 3. Modelo de datos

`prisma/schema.prisma` implementa el modelo sugerido con algunos ajustes:

- Enums de Postgres para `status`, `priority`, `role`, `category`, etc. en vez de
  strings libres, para integridad de datos.
- `severity` en `Risk` se guarda calculada (`probabilidad × impacto`) para poder
  ordenar/filtrar por severidad sin recalcular en cada query.
- `ActivityLog.entityType`/`action` quedaron como `String` libre (no enum) para
  no tener que migrar el schema cada vez que un módulo nuevo quiera loguear un
  tipo de acción distinto.
- Presupuestos (`budgetPlanned`/`budgetSpent`) son `Float`, sin moneda fija —
  proyectos personales pueden estar en distintas monedas; si más adelante quieres
  soporte multi-moneda real, se puede agregar un campo `currency`.

## 4. Plan de fases

| Fase | Alcance | Estado |
|---|---|---|
| **1. Fundaciones** | Setup, modelo de datos completo, auth, CRUD de Proyectos, layout base (Sidebar/Topbar), dashboard placeholder con datos reales | ✅ Completa |
| **2. Tareas y Gantt** | CRUD de tareas y dependencias, vista Gantt interactiva (drag/resize, custom), vista Lista, vista Kanban (drag & drop), hitos, indicador de vencidas, filtros | ✅ Completa |
| **3. Riesgos** | CRUD de riesgos, matriz de calor 5×5, vista consolidada multi-proyecto | ⏳ Próxima |
| **4. Flujos** | Constructor visual con React Flow, tipos de nodo, versionado, plantillas reutilizables | Planeada |
| **5. Dashboard ejecutivo** | Health score por proyecto, timeline consolidado de hitos, top riesgos cross-proyecto, carga de trabajo por responsable, gráficos (Recharts) | Planeada |
| **6. Pulido** | Roles multi-usuario reales, exportación PDF/Excel, notificaciones, mejoras responsive | Planeada |

Cada fase se entrega, se revisa contigo, y recién ahí se empieza la siguiente.
