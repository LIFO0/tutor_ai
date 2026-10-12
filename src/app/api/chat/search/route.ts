import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { normalizeSearchQuery } from "@/lib/chat-search-query";
import { searchChats } from "@/lib/chat-search";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const q = normalizeSearchQuery(new URL(req.url).searchParams.get("q"));
  if (!q) return NextResponse.json({ ok: true, results: [] });
  const results = searchChats(user.id, q);
  return NextResponse.json({ ok: true, results });
}
