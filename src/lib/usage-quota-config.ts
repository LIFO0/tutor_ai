import type { QuotaLimits, UserPlan } from "@/lib/usage-types";

const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function isQuotaGloballyDisabled(): boolean {
  return process.env.USAGE_QUOTA_DISABLED === "1";
}

export function isQuotaExemptByEmail(email: string): boolean {
  const raw = process.env.USAGE_QUOTA_EXEMPT_EMAILS ?? "";
  const emails = new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
  return emails.has(email.trim().toLowerCase());
}

export function isQuotaExemptUserId(userId: number): boolean {
  const idsRaw = process.env.USAGE_QUOTA_EXEMPT_USER_IDS ?? "";
  const ids = new Set(
    idsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n)),
  );
  return ids.has(userId);
}

export function getMoscowDateString(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function getQuotaResetsAt(): string {
  const today = getMoscowDateString();
  const [y, m, d] = today.split("-").map(Number);
  const tomorrowMskMidnightUtc = Date.UTC(y, m - 1, d + 1, 0, 0, 0) - MSK_OFFSET_MS;
  return new Date(tomorrowMskMidnightUtc).toISOString();
}

export function resolveEffectivePlan(user: {
  plan?: string | null;
  planExpiresAt?: string | null;
}): UserPlan {
  const plan = user.plan === "plus" ? "plus" : "free";
  if (plan !== "plus") return "free";
  if (!user.planExpiresAt) return "plus";
  const expires = Date.parse(user.planExpiresAt);
  if (Number.isNaN(expires) || expires < Date.now()) return "free";
  return "plus";
}

export function getPlanLimits(plan: UserPlan): QuotaLimits {
  if (plan === "plus") {
    return {
      chatMessages: envInt("USAGE_PLUS_CHAT_PER_DAY", 50),
      taskGenerate: envInt("USAGE_PLUS_TASK_GEN_PER_DAY", 12),
      taskCheck: envInt("USAGE_PLUS_TASK_CHECK_PER_DAY", 24),
      chatSessions: envInt("USAGE_PLUS_CHAT_SESSIONS_PER_DAY", 30),
      burstChatPerMin: envInt("USAGE_PLUS_BURST_CHAT_PER_MIN", 16),
    };
  }
  return {
    chatMessages: envInt("USAGE_FREE_CHAT_PER_DAY", 16),
    taskGenerate: envInt("USAGE_FREE_TASK_GEN_PER_DAY", 4),
    taskCheck: envInt("USAGE_FREE_TASK_CHECK_PER_DAY", 6),
    chatSessions: envInt("USAGE_FREE_CHAT_SESSIONS_PER_DAY", 10),
    burstChatPerMin: envInt("USAGE_BURST_CHAT_PER_MIN", 8),
  };
}
