import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { isAdminEmail } from "@/lib/feedback";
import { readFeedbackScreenshot } from "@/lib/feedback-server";

/** Admin-only access to feedback screenshots. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) return jsonError("Not found", 404);
  const { key } = await params;
  const buf = await readFeedbackScreenshot(decodeURIComponent(key));
  if (!buf) return jsonError("Not found", 404);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
