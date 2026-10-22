import { getCurrentUser } from "@/lib/current-user";
import { redirectToLoginForInvalidSession } from "@/lib/session-redirect";
import { isLlmConfigured } from "@/lib/llm-config";
import { AppLayoutClient } from "@/components/layout/AppLayoutClient";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return redirectToLoginForInvalidSession();

  return (
    <AppLayoutClient user={user} llmConfigured={isLlmConfigured()}>
      {children}
    </AppLayoutClient>
  );
}

