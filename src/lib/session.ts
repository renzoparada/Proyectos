import { SignJWT, jwtVerify } from "jose";

// Kept dependency-free of Prisma/bcrypt so it can run in the proxy (edge
// runtime). Anything that needs the database lives in auth.ts instead.

export const SESSION_COOKIE = "crm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  sub: string; // user id
  email: string;
  name: string;
  role: "ADMIN" | "COLLABORATOR" | "READ_ONLY";
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Copy .env.example to .env and set it.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      typeof payload.role === "string"
    ) {
      return payload as unknown as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
