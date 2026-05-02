import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { DashboardClaudeHome } from "@/components/dashboard/DashboardClaudeHome";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <DashboardClaudeHome userName={user.name} />;
}
