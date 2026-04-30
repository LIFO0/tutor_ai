import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { listTaskHistory } from "@/lib/tasks";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const history = await listTaskHistory(user.id);
  return NextResponse.json({ ok: true, history });
}

