import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { currentSession } from "@/app/acceso/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await currentSession();
  if (!session) redirect("/acceso");

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">{children}</main>
    </AppShell>
  );
}
