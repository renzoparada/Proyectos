// Client-safe permission helpers (no "server-only" — used in client
// components to hide actions the API would reject anyway). Mirrors the
// server-side role gate in src/lib/auth.ts#requireApiRole.
export type Role = "ADMIN" | "COLLABORATOR" | "READ_ONLY";

export function canWrite(role: Role) {
  return role === "ADMIN" || role === "COLLABORATOR";
}

export function isAdmin(role: Role) {
  return role === "ADMIN";
}
