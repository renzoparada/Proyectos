import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// `middleware.ts` was renamed to `proxy.ts` in Next.js 16 — this is that file.
// It gate-keeps every route except the login page and static/API-auth assets.

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.includes(pathname);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!isPublic && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Only guard actual pages. API routes authenticate themselves (and
     * return 401 JSON instead of an HTML redirect), and static/internal
     * assets never need a session check.
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
