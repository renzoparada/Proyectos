import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamView } from "@/components/team/TeamView";
import type { UserDTO } from "@/types/user";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireSession();
  if (session.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Equipo</h1>
        <p className="text-sm text-muted">
          Administra quién puede acceder y qué puede hacer cada persona.
        </p>
      </div>

      <TeamView
        initialUsers={JSON.parse(JSON.stringify(users)) as UserDTO[]}
        currentUserId={session.sub}
      />
    </div>
  );
}
