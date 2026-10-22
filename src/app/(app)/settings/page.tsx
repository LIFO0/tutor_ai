import { getCurrentUser } from "@/lib/current-user";
import { redirectToLoginForInvalidSession } from "@/lib/session-redirect";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return redirectToLoginForInvalidSession();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-10">
      <div className="flex w-full max-w-3xl flex-col items-center gap-5">
        <div className="w-full text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Настройки
          </h1>
        </div>
        <div className="w-full">
          <SettingsForm key={user.id} initialUser={user} />
        </div>
      </div>
    </div>
  );
}
