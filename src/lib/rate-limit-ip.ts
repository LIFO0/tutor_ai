import "server-only";

/** In-memory sliding window; подходит для одного Node-процесса (типичный VPS). */
const hits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const fromForwarded = forwarded?.split(",")[0]?.trim();
  return (
    fromForwarded ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
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
