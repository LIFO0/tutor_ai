/** Pure feedback helpers (validation, admin check). Safe for client and server. */

export const FEEDBACK_TOPICS = [
  { key: "bug", label: "Что-то сломалось" },
  { key: "question", label: "Есть вопрос" },
  { key: "idea", label: "Есть идея" },
  { key: "payment", label: "Оплата и тариф" },
  { key: "other", label: "Другое" },
] as const;

export type FeedbackTopic = (typeof FEEDBACK_TOPICS)[number]["key"];

export const FEEDBACK_TEXT_MIN = 5;
export const FEEDBACK_TEXT_MAX = 3000;
export const FEEDBACK_SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;
export const FEEDBACK_SCREENSHOT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const FEEDBACK_DAILY_LIMIT = 5;

export function feedbackTopicLabel(key: string): string {
  return FEEDBACK_TOPICS.find((t) => t.key === key)?.label ?? key;
}

export function isFeedbackTopic(v: unknown): v is FeedbackTopic {
  return typeof v === "string" && FEEDBACK_TOPICS.some((t) => t.key === v);
}

export type FeedbackInput = {
  topic: unknown;
  text: unknown;
  screenshot?: { size: number; type: string } | null;
};

export type FeedbackValidation =
  | { ok: true; topic: FeedbackTopic; text: string }
  | { ok: false; error: string };

export function validateFeedback(input: FeedbackInput): FeedbackValidation {
  if (!isFeedbackTopic(input.topic)) return { ok: false, error: "Выбери тему обращения." };
  const text = typeof input.text === "string" ? input.text.replace(/\r\n/g, "\n").trim() : "";
  if (text.length < FEEDBACK_TEXT_MIN) {
    return { ok: false, error: "Напиши чуть подробнее, что случилось — хотя бы пару слов." };
  }
  if (text.length > FEEDBACK_TEXT_MAX) {
    return { ok: false, error: `Сообщение слишком длинное (до ${FEEDBACK_TEXT_MAX} символов).` };
  }
  const s = input.screenshot;
  if (s && s.size > 0) {
    if (!(FEEDBACK_SCREENSHOT_TYPES as readonly string[]).includes(s.type)) {
      return { ok: false, error: "Скриншот должен быть картинкой JPEG, PNG или WebP." };
    }
    if (s.size > FEEDBACK_SCREENSHOT_MAX_BYTES) {
      return { ok: false, error: "Скриншот слишком большой (до 5 МБ)." };
    }
  }
  return { ok: true, topic: input.topic, text };
}

/** ADMIN_EMAILS — comma list, case-insensitive. Empty → nobody is admin. */
export function isAdminEmail(email: string | null | undefined, raw = process.env.ADMIN_EMAILS): boolean {
  if (!email) return false;
  const list = (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
