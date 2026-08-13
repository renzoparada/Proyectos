import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <AppShell user={session}>{children}</AppShell>;
}
