import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { isYandexLlmConfigured } from "@/lib/llm-config";
import { AppLayoutClient } from "@/components/layout/AppLayoutClient";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppLayoutClient user={user} llmConfigured={isYandexLlmConfigured()}>
      {children}
    </AppLayoutClient>
  );
}

