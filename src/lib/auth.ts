import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE, type SessionPayload, verifySessionToken } from "@/lib/session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Reads and verifies the session cookie. Returns null if not logged in. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Use in server components / route handlers that require a logged-in user. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Role hierarchy for future multi-user support. ADMIN can do everything,
 * COLLABORATOR can edit, READ_ONLY can only view. Phase 1 only ever creates
 * ADMIN users, but routes can already opt into a minimum role.
 */
const ROLE_RANK: Record<SessionPayload["role"], number> = {
  READ_ONLY: 0,
  COLLABORATOR: 1,
  ADMIN: 2,
};

export function hasRole(session: SessionPayload, minRole: SessionPayload["role"]) {
  return ROLE_RANK[session.role] >= ROLE_RANK[minRole];
}

/**
 * Auth + role gate for route handlers. Returns `{ session }` when the caller
 * is logged in and meets `minRole`, otherwise `{ response }` with the 401/403
 * to return as-is: `const gate = await requireApiRole(...); if (gate.response) return gate.response;`
 *
 * Defaults to COLLABORATOR, the minimum role for any create/update mutation
 * — READ_ONLY users can look at everything but never write. Pass "ADMIN" for
 * destructive actions (deleting a project) and user management.
 */
export async function requireApiRole(
  minRole: SessionPayload["role"] = "COLLABORATOR"
): Promise<{ session: SessionPayload; response?: undefined } | { session?: undefined; response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (!hasRole(session, minRole)) {
    return {
      response: NextResponse.json(
        { error: "Tu rol no tiene permiso para realizar esta acción" },
        { status: 403 }
      ),
    };
  }
  return { session };
}
