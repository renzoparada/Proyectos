import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
