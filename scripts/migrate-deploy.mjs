// Runs `prisma migrate deploy` against the direct (unpooled) database
// connection when available, falling back to DATABASE_URL otherwise.
//
// Why this exists: Neon's pooled connection (PgBouncer in transaction mode,
// the "-pooler" host used by DATABASE_URL) doesn't reliably release the
// Postgres advisory lock that Prisma Migrate uses to prevent concurrent
// migrations — a deploy can hang until timeout (Error: P1002). The fix is
// to run migrations against the direct connection (DATABASE_URL_UNPOOLED)
// and leave the pooled one for the app's normal runtime queries.
//
// This is a plain Node script (not inline shell) on purpose: connection
// strings often contain "&" in their query string, which shells treat as
// a control character unless quoting is exactly right — a real deploy
// failure already happened here from shell quoting. Passing the value
// through a child process env object sidesteps that entirely.
import { spawnSync } from "node:child_process";

// Only override DATABASE_URL when we actually have a direct connection to
// override it with — otherwise leave process.env untouched so the child
// process's own `dotenv/config` (via prisma.config.ts) can fill it in from
// .env, same as any other local command.
const unpooled = process.env.DATABASE_URL_UNPOOLED;
const env = unpooled ? { ...process.env, DATABASE_URL: unpooled } : process.env;

const result = spawnSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env,
});

process.exit(result.status ?? 1);
