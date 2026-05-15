import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { DashboardClaudeHome } from "@/components/dashboard/DashboardClaudeHome";
import { GradeOnboardingModal } from "@/components/onboarding/GradeOnboardingModal";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = (await searchParams) ?? {};
  const onboardingRaw = sp.onboarding;
  const onboarding = Array.isArray(onboardingRaw) ? onboardingRaw[0] : onboardingRaw;
  const showGrade = onboarding === "grade";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DashboardClaudeHome userName={user.name} />
      <GradeOnboardingModal show={showGrade} initialGrade={user.grade} />
    </div>
  );
}
