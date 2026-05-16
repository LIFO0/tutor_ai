import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { QuotaCounters, QuotaKind, QuotaLimits, UsageSnapshot } from "@/lib/usage-types";
import { quotaExceededMessage } from "@/lib/usage-types";
import {
  getMoscowDateString,
  getPlanLimits,
  getQuotaResetsAt,
  isQuotaExemptByEmail,
  isQuotaExemptUserId,
  isQuotaGloballyDisabled,
  resolveEffectivePlan,
} from "@/lib/usage-quota-config";

export type QuotaUser = { id: number; email: string; plan?: string | null; planExpiresAt?: string | null };

export {
  getMoscowDateString,
  getPlanLimits,
  getQuotaResetsAt,
  isQuotaExemptByEmail,
  isQuotaGloballyDisabled,
  resolveEffectivePlan,
} from "@/lib/usage-quota-config";

export function toQuotaUser(user: {
  id: number;
  email: string;
  plan?: string | null;
  planExpiresAt?: string | null;
}): QuotaUser {
  return {
    id: user.id,
    email: user.email,
    plan: user.plan ?? "free",
    planExpiresAt: user.planExpiresAt ?? null,
  };
}

const chatBurstHits = new Map<string, number[]>();

export function isQuotaExemptUser(user: QuotaUser): boolean {
  if (isQuotaExemptByEmail(user.email)) return true;
  return isQuotaExemptUserId(user.id);
}

function kindToLimitKey(kind: QuotaKind): keyof Omit<QuotaLimits, "burstChatPerMin"> {
  switch (kind) {
    case "chat_message":
      return "chatMessages";
    case "task_generate":
      return "taskGenerate";
    case "task_check":
      return "taskCheck";
    case "chat_session":
      return "chatSessions";
  }
}

function emptyCounters(): QuotaCounters {
  return { chatMessages: 0, taskGenerate: 0, taskCheck: 0, chatSessions: 0 };
}

function rowToCounters(row: {
  chatMessages: number;
  taskGenerate: number;
  taskCheck: number;
  chatSessions: number;
}): QuotaCounters {
  return {
    chatMessages: row.chatMessages,
    taskGenerate: row.taskGenerate,
    taskCheck: row.taskCheck,
    chatSessions: row.chatSessions,
  };
}

function remainingFrom(used: QuotaCounters, limits: QuotaLimits): QuotaCounters {
  return {
    chatMessages: Math.max(0, limits.chatMessages - used.chatMessages),
    taskGenerate: Math.max(0, limits.taskGenerate - used.taskGenerate),
    taskCheck: Math.max(0, limits.taskCheck - used.taskCheck),
    chatSessions: Math.max(0, limits.chatSessions - used.chatSessions),
  };
}

async function ensureUsageRow(userId: number, date: string) {
  const db = getDb();
  await db
    .insert(schema.usageDaily)
    .values({ userId, date })
    .onConflictDoNothing({ target: [schema.usageDaily.userId, schema.usageDaily.date] });
}

async function readUsageRow(userId: number, date: string) {
  const db = getDb();
  const rows = await db
    .select({
      chatMessages: schema.usageDaily.chatMessages,
      taskGenerate: schema.usageDaily.taskGenerate,
      taskCheck: schema.usageDaily.taskCheck,
      chatSessions: schema.usageDaily.chatSessions,
    })
    .from(schema.usageDaily)
    .where(and(eq(schema.usageDaily.userId, userId), eq(schema.usageDaily.date, date)))
    .limit(1);
  return rows[0] ?? null;
}

function checkChatBurst(userId: number, max: number): { ok: true } | { ok: false; retryAfterSec: number } {
  const key = String(userId);
  const now = Date.now();
  const windowMs = 60_000;
  let arr = chatBurstHits.get(key) ?? [];
  arr = arr.filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    const oldest = arr[0]!;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    chatBurstHits.set(key, arr);
    return { ok: false, retryAfterSec };
  }
  arr.push(now);
  chatBurstHits.set(key, arr);
  return { ok: true };
}

export async function getUsageSnapshot(user: QuotaUser): Promise<UsageSnapshot> {
  const resetsAt = getQuotaResetsAt();
  if (isQuotaGloballyDisabled() || isQuotaExemptUser(user)) {
    const plan = resolveEffectivePlan(user);
    const limits = getPlanLimits(plan);
    return {
      exempt: true,
      plan,
      resetsAt,
      limits,
      used: emptyCounters(),
      remaining: {
        chatMessages: limits.chatMessages,
        taskGenerate: limits.taskGenerate,
        taskCheck: limits.taskCheck,
        chatSessions: limits.chatSessions,
      },
    };
  }

  const plan = resolveEffectivePlan(user);
  const limits = getPlanLimits(plan);
  const date = getMoscowDateString();
  await ensureUsageRow(user.id, date);
  const row = await readUsageRow(user.id, date);
  const used = row ? rowToCounters(row) : emptyCounters();

  return {
    exempt: false,
    plan,
    resetsAt,
    limits,
    used,
    remaining: remainingFrom(used, limits),
  };
}

export type QuotaConsumeResult =
  | { ok: true }
  | {
      ok: false;
      error: "quota_exceeded" | "rate_limited";
      kind: QuotaKind;
      limit: number;
      used: number;
      resetsAt: string;
      message: string;
      retryAfterSec?: number;
    };

export async function checkAndConsume(user: QuotaUser, kind: QuotaKind): Promise<QuotaConsumeResult> {
  if (isQuotaGloballyDisabled() || isQuotaExemptUser(user)) {
    return { ok: true };
  }

  const plan = resolveEffectivePlan(user);
  const limits = getPlanLimits(plan);

  if (kind === "chat_message") {
    const burst = checkChatBurst(user.id, limits.burstChatPerMin);
    if (!burst.ok) {
      return {
        ok: false,
        error: "rate_limited",
        kind,
        limit: limits.burstChatPerMin,
        used: limits.burstChatPerMin,
        resetsAt: getQuotaResetsAt(),
        message: `Подождите немного перед следующим сообщением (не более ${limits.burstChatPerMin} в минуту).`,
        retryAfterSec: burst.retryAfterSec,
      };
    }
  }

  const date = getMoscowDateString();
  await ensureUsageRow(user.id, date);

  const limitKey = kindToLimitKey(kind);
  const limit = limits[limitKey];

  const db = getDb();
  const baseWhere = and(eq(schema.usageDaily.userId, user.id), eq(schema.usageDaily.date, date));

  let updated: { value: number }[] = [];
  switch (kind) {
    case "chat_message":
      updated = await db
        .update(schema.usageDaily)
        .set({ chatMessages: sql`${schema.usageDaily.chatMessages} + 1` })
        .where(and(baseWhere, sql`${schema.usageDaily.chatMessages} < ${limit}`))
        .returning({ value: schema.usageDaily.chatMessages });
      break;
    case "task_generate":
      updated = await db
        .update(schema.usageDaily)
        .set({ taskGenerate: sql`${schema.usageDaily.taskGenerate} + 1` })
        .where(and(baseWhere, sql`${schema.usageDaily.taskGenerate} < ${limit}`))
        .returning({ value: schema.usageDaily.taskGenerate });
      break;
    case "task_check":
      updated = await db
        .update(schema.usageDaily)
        .set({ taskCheck: sql`${schema.usageDaily.taskCheck} + 1` })
        .where(and(baseWhere, sql`${schema.usageDaily.taskCheck} < ${limit}`))
        .returning({ value: schema.usageDaily.taskCheck });
      break;
    case "chat_session":
      updated = await db
        .update(schema.usageDaily)
        .set({ chatSessions: sql`${schema.usageDaily.chatSessions} + 1` })
        .where(and(baseWhere, sql`${schema.usageDaily.chatSessions} < ${limit}`))
        .returning({ value: schema.usageDaily.chatSessions });
      break;
  }

  if (updated.length > 0) {
    return { ok: true };
  }

  const row = await readUsageRow(user.id, date);
  const used = row ? rowToCounters(row) : emptyCounters();
  const usedForKind = used[limitKey];

  return {
    ok: false,
    error: "quota_exceeded",
    kind,
    limit,
    used: usedForKind,
    resetsAt: getQuotaResetsAt(),
    message: quotaExceededMessage(kind, limit),
  };
}
