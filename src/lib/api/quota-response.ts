import { NextResponse } from "next/server";
import type { QuotaConsumeResult } from "@/lib/usage-quota";

export function quotaErrorResponse(result: Extract<QuotaConsumeResult, { ok: false }>) {
  const status = result.error === "rate_limited" ? 429 : 429;
  const headers: Record<string, string> = {};
  if (result.retryAfterSec) {
    headers["Retry-After"] = String(result.retryAfterSec);
  }
  return NextResponse.json(
    {
      ok: false,
      error: result.error,
      kind: result.kind,
      limit: result.limit,
      used: result.used,
      resetsAt: result.resetsAt,
      message: result.message,
    },
    { status, headers },
  );
}
