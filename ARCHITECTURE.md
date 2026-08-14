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
| Gráficos (Fase 5) | Recharts | Dashboard ejecutivo: dona de estados, barras de avance, tendencia de riesgos, presupuesto. |
| Gantt (Fase 2) | **Construido a medida** (`src/components/tasks/GanttChart.tsx`) | Ver justificación abajo. |
| Diagramas de flujo (Fase 4) | `@xyflow/react` (React Flow v12) | Peer deps `react >=17`, compatible con React 19 (a diferencia de `gantt-task-react`). |
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
- **Guardado de flujos: reemplazo completo del grafo, no reconciliación
  incremental**: al guardar, el editor manda TODOS los nodos/aristas actuales
  y `PUT /api/workflows/[id]/graph` borra y recrea todo dentro de una
  transacción (ver `src/app/api/workflows/[id]/graph/route.ts`). Es más simple
  y suficientemente rápido para diagramas de decenas de nodos (uso personal,
  sin colaboración en tiempo real); si el flujo creciera a cientos de nodos o
  se necesitara edición concurrente, ahí sí conviene un diff incremental.
- **Versionado simple, no historial completo**: "guardar nueva versión" solo
  incrementa `Workflow.version` en la misma fila (no guarda snapshots de
  versiones anteriores). Si más adelante quieres poder volver a una versión
  vieja, hay que agregar una tabla `WorkflowVersion` que snapshotee
  nodos/aristas en cada bump — el modelo actual no lo bloquea, es aditivo.
- **El editor de flujos es desktop-first**: la paleta de nodos se oculta en
  mobile (`sm:block`) porque armar un diagrama de nodos con el dedo es poco
  práctico; en mobile se puede ver/hacer pan-zoom del diagrama y gestionar la
  lista de flujos, pero no agregar nodos. Mismo criterio que el Gantt.
- **Health score: sistema de penalización aditiva, no un modelo de ML**
  (`src/lib/health-score.ts`): parte de 100 y resta por avance por debajo del
  tiempo transcurrido, tareas vencidas y riesgos abiertos de severidad alta+;
  el resultado se banda en `GREEN`/`YELLOW`/`RED` con las razones expuestas
  (no solo el número), para que el ejecutivo entienda *por qué* un proyecto
  está en rojo sin abrir el detalle. Simple, determinístico y fácil de
  ajustar (son constantes en un solo archivo) en vez de un score "caja negra".
- **Dashboard como agregaciones server-side, no client-side**: `getDashboardData()`
  (`src/lib/dashboard-data.ts`) hace todas las queries pesadas (conteos,
  promedios, top riesgos, carga de trabajo) con Prisma en el servidor y le
  pasa al cliente solo los datos ya calculados; Recharts solo dibuja. Evita
  mandar todas las tareas/riesgos de todos los proyectos al navegador para
  agregarlos ahí.
- **Roles reales en vez de solo el campo `role` de la Fase 1**: cada ruta
  mutante (`POST`/`PATCH`/`DELETE` de proyectos, tareas, riesgos, flujos)
  pasa por `requireApiRole()` (`src/lib/auth.ts`), que devuelve 401/403 según
  corresponda antes de tocar la base de datos. La UI usa las mismas reglas
  del lado cliente (`src/lib/permissions.ts`: `canWrite()`/`isAdmin()`) para
  ocultar botones de escritura — pero la fuente de verdad es siempre el
  servidor, nunca se confía en que el cliente oculte algo. `READ_ONLY` no ve
  botones de mutación en ninguna vista; `/team` (gestión de usuarios) está
  restringido a `ADMIN` con redirect server-side. Se bloquea explícitamente
  la auto-degradación de rol, la auto-eliminación y eliminar el último ADMIN.
- **Exportación CSV en vez de PDF/Excel real**: el spec original mencionaba
  "PDF/Excel", pero para datos tabulares (proyectos, tareas, riesgos) CSV es
  el formato que Excel/Sheets abren nativamente sin ninguna librería nueva —
  `src/lib/csv.ts` genera el archivo client-side (Blob + BOM UTF-8) a partir
  de la vista ya filtrada en pantalla. Se descartó agregar una librería de
  generación de PDF (peso y complejidad no justificados para un export de
  tablas); si más adelante se necesita un reporte con formato visual
  (no solo filas y columnas), ahí sí conviene evaluar una librería de PDF.
- **Notificaciones in-app computadas, no una tabla ni infraestructura de
  push/email**: `GET /api/notifications` recalcula en cada llamada las tareas
  vencidas, riesgos críticos abiertos e hitos de los próximos 7 días — no hay
  tabla `Notification` ni estado de "leído". Es más simple y siempre está al
  día (no puede desincronizarse), a costa de no tener historial. El
  `NotificationBell` hace polling cada 2 minutos; si el uso creciera a
  multi-usuario con notificaciones dirigidas por persona, ahí sí conviene una
  tabla con estado de lectura y quizás WebSockets/SSE en vez de polling.

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
| **3. Riesgos** | CRUD de riesgos, severidad calculada, matriz de calor 5×5 por proyecto y consolidada multi-proyecto | ✅ Completa |
| **4. Flujos** | Constructor visual con React Flow, 5 tipos de nodo, conectores con etiqueta, versionado, plantillas reutilizables y flujos por proyecto | ✅ Completa |
| **5. Dashboard ejecutivo** | Health score por proyecto, timeline consolidado de hitos, top riesgos cross-proyecto, carga de trabajo por responsable, gráficos (Recharts) | ✅ Completa |
| **6. Pulido** | Roles multi-usuario reales, exportación CSV, notificaciones in-app, mejoras responsive | ✅ Completa |

Cada fase se entrega, se revisa contigo, y recién ahí se empieza la siguiente.
Con la Fase 6 se cierran las 6 fases del roadmap original.
