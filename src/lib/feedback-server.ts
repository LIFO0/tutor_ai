import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getSqlite } from "@/lib/db";
import { resolveChatUploadsDir } from "@/lib/chat-uploads";
import { getMoscowDateString } from "@/lib/usage-quota-config";
import type { FeedbackTopic } from "@/lib/feedback";

const KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/i;

export function isValidFeedbackScreenshotKey(key: string): boolean {
  return KEY_RE.test(key);
}

/** Screenshots live in <CHAT_UPLOADS_PATH>/feedback/. */
function feedbackDir(): string {
  const dir = path.join(resolveChatUploadsDir(), "feedback");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function saveFeedbackScreenshot(input: Buffer): Promise<string> {
  let jpeg: Buffer;
  try {
    jpeg = await sharp(input)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new Error("Не получилось прочитать картинку. Попробуй другой файл (JPEG, PNG или WebP).");
  }
  const key = `${randomUUID()}.jpg`;
  await fsp.writeFile(path.join(feedbackDir(), key), jpeg);
  return key;
}

export async function readFeedbackScreenshot(key: string): Promise<Buffer | null> {
  if (!isValidFeedbackScreenshotKey(key)) return null;
  try {
    const b = await fsp.readFile(path.join(feedbackDir(), key));
    return b.length ? b : null;
  } catch {
    return null;
  }
}

export async function deleteFeedbackScreenshot(key: string): Promise<void> {
  if (!isValidFeedbackScreenshotKey(key)) return;
  await fsp.unlink(path.join(feedbackDir(), key)).catch(() => undefined);
}

/** Feedback submitted today (MSK day) by the user. */
export function countFeedbackToday(userId: number): number {
  const row = getSqlite()
    .prepare("SELECT count(*) AS n FROM feedback WHERE user_id = ? AND msk_date = ?")
    .get(userId, getMoscowDateString()) as { n: number };
  return row.n;
}

export function insertFeedback(p: {
  userId: number;
  topic: FeedbackTopic;
  text: string;
  screenshotKey: string | null;
  pageUrl: string | null;
  userAgent: string | null;
}): number {
  const r = getSqlite()
    .prepare(
      `INSERT INTO feedback (user_id, topic, text, screenshot_key, page_url, user_agent, msk_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(p.userId, p.topic, p.text, p.screenshotKey, p.pageUrl, p.userAgent, getMoscowDateString());
  return Number(r.lastInsertRowid);
}

export type FeedbackRow = {
  id: number;
  userId: number;
  userEmail: string | null;
  userName: string | null;
  topic: string;
  text: string;
  screenshotKey: string | null;
  pageUrl: string | null;
  userAgent: string | null;
  createdAt: string;
};

export function listFeedback(limit = 200): FeedbackRow[] {
  return getSqlite()
    .prepare(
      `SELECT f.id, f.user_id AS userId, u.email AS userEmail, u.name AS userName, f.topic, f.text,
              f.screenshot_key AS screenshotKey, f.page_url AS pageUrl, f.user_agent AS userAgent,
              f.created_at AS createdAt
       FROM feedback f LEFT JOIN users u ON u.id = f.user_id
       ORDER BY f.id DESC LIMIT ?`,
    )
    .all(limit) as FeedbackRow[];
}
