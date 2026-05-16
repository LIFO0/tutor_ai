export type QuotaKind = "chat_message" | "task_generate" | "task_check" | "chat_session";

export type UserPlan = "free" | "plus";

export type QuotaLimits = {
  chatMessages: number;
  taskGenerate: number;
  taskCheck: number;
  chatSessions: number;
  burstChatPerMin: number;
};

export type QuotaCounters = {
  chatMessages: number;
  taskGenerate: number;
  taskCheck: number;
  chatSessions: number;
};

export type UsageSnapshot = {
  exempt: boolean;
  plan: UserPlan;
  resetsAt: string;
  limits: QuotaLimits;
  used: QuotaCounters;
  remaining: QuotaCounters;
};

export type QuotaExceededPayload = {
  ok: false;
  error: "quota_exceeded" | "rate_limited";
  kind: QuotaKind;
  limit: number;
  used: number;
  resetsAt: string;
  message?: string;
};

export function quotaKindLabel(kind: QuotaKind): string {
  switch (kind) {
    case "chat_message":
      return "сообщений в чате";
    case "task_generate":
      return "генераций задач";
    case "task_check":
      return "проверок ответов";
    case "chat_session":
      return "новых чатов";
  }
}

export function quotaExceededMessage(kind: QuotaKind, limit: number): string {
  switch (kind) {
    case "chat_message":
      return `На сегодня ты задал все ${limit} вопросов Мишке. Завтра лимит обновится!`;
    case "task_generate":
      return `Сегодня уже сгенерировано ${limit} ${limit === 1 ? "задача" : limit < 5 ? "задачи" : "задач"}. Попробуй завтра или разбери старые из истории.`;
    case "task_check":
      return `Лимит проверок на сегодня (${limit}) исчерпан.`;
    case "chat_session":
      return `Слишком много новых чатов за день (${limit}). Продолжи в существующем.`;
  }
}

export function quotaWarningMessage(kind: QuotaKind, remaining: number): string {
  const unit =
    kind === "chat_message"
      ? remaining === 1
        ? "сообщение"
        : remaining < 5
          ? "сообщения"
          : "сообщений"
      : kind === "task_generate"
        ? remaining === 1
          ? "генерация"
          : remaining < 5
            ? "генерации"
            : "генераций"
        : kind === "task_check"
          ? remaining === 1
            ? "проверка"
            : remaining < 5
              ? "проверки"
              : "проверок"
          : remaining === 1
            ? "новый чат"
            : remaining < 5
              ? "новых чата"
              : "новых чатов";
  return `Осталось ${remaining} ${unit} на сегодня. Лимит обновится завтра в 00:00 (МСК).`;
}

export function formatQuotaResetsAt(resetsAt: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(resetsAt));
  } catch {
    return "завтра в 00:00 (МСК)";
  }
}
