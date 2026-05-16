"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuotaExceededPayload, UsageSnapshot } from "@/lib/usage-types";

type UsageApiOk = { ok: true } & UsageSnapshot;

async function fetchUsageSnapshot(): Promise<UsageSnapshot | null> {
  const res = await fetch("/api/usage", { cache: "no-store" });
  const data = (await res.json().catch(() => null)) as UsageApiOk | null;
  if (res.ok && data?.ok) {
    return {
      exempt: data.exempt,
      plan: data.plan,
      resetsAt: data.resetsAt,
      limits: data.limits,
      used: data.used,
      remaining: data.remaining,
    };
  }
  return null;
}

export function useUsage() {
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchUsageSnapshot();
      if (next) setUsage(next);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await fetchUsageSnapshot();
        if (!cancelled && next) setUsage(next);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { usage, loading, refresh };
}

export function parseQuotaResponse(
  res: Response,
  data: unknown,
): QuotaExceededPayload | null {
  if (res.status !== 429 || !data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.error !== "quota_exceeded" && d.error !== "rate_limited") return null;
  if (typeof d.kind !== "string") return null;
  return {
    ok: false,
    error: d.error as "quota_exceeded" | "rate_limited",
    kind: d.kind as QuotaExceededPayload["kind"],
    limit: Number(d.limit) || 0,
    used: Number(d.used) || 0,
    resetsAt: String(d.resetsAt ?? ""),
    message: typeof d.message === "string" ? d.message : undefined,
  };
}
