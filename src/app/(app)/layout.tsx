import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Sidebar } from "@/components/layout/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-full flex flex-1">
      <Sidebar user={user} />
      <main className="flex min-w-0 flex-1 flex-col bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}

