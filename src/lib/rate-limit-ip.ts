import "server-only";

/** In-memory sliding window; подходит для одного Node-процесса (типичный VPS). */
const hits = new Map<string, number[]>();

const MAX_RATE_LIMIT_WINDOW_MS = 60 * 60_000;
const CLEANUP_INTERVAL_MS = 5 * 60_000;

function clientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    const last = ips[ips.length - 1];
    if (last) return last;
  }

  return req.headers.get("x-real-ip")?.trim() ?? "unknown";
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, arr] of hits) {
      if (arr.every((t) => now - t > MAX_RATE_LIMIT_WINDOW_MS)) {
        hits.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS).unref();
}

export function checkIpRateLimit(
  req: Request,
  bucket: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  let arr = hits.get(key) ?? [];
  arr = arr.filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    const oldest = arr[0]!;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    hits.set(key, arr);
    return { ok: false, retryAfterSec };
  }
  arr.push(now);
  hits.set(key, arr);
  return { ok: true };
}
