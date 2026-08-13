import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Minimal user directory for assignee pickers. Phase 1/2 only ever has the
// single seeded admin, but the route already returns whatever the User table
// holds so it doesn't need to change when multi-user support lands.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}
