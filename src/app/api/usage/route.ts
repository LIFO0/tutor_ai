import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { getUsageSnapshot } from "@/lib/usage-quota";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const snapshot = await getUsageSnapshot({
    id: user.id,
    email: user.email,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
  });

  return NextResponse.json({ ok: true, ...snapshot });
}
