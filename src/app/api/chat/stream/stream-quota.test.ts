import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Изолированная БД и каталог загрузок для этого файла.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stream-quota-"));
process.env.DATABASE_PATH = path.join(tmpDir, "test.db");
process.env.CHAT_UPLOADS_PATH = path.join(tmpDir, "uploads");
delete process.env.USAGE_QUOTA_DISABLED;
delete process.env.USAGE_QUOTA_EXEMPT_EMAILS;
delete process.env.USAGE_QUOTA_EXEMPT_USER_IDS;

const testUser = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: async () => testUser.current,
}));
vi.mock("@/lib/llm-config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/llm-config")>()),
  assertLlmConfigured: () => null,
}));
vi.mock("@/lib/llm", () => ({
  streamCompletion: async function* () {
    yield "ok";
  },
  completeText: async () => null,
}));

const { POST } = await import("./route");
const { getDb, schema } = await import("@/lib/db");
const { createChatSession } = await import("@/lib/chat");
const { getUsageSnapshot } = await import("@/lib/usage-quota");

let sessionId = 0;
const quotaUser = { id: 0, email: "quota-test@example.com", plan: "free", planExpiresAt: null };

function imageRequest(bytes: Buffer, name: string, type: string) {
  const form = new FormData();
  form.set("sessionId", String(sessionId));
  form.set("message", "Помоги с задачей");
  form.set("file", new File([new Uint8Array(bytes)], name, { type }));
  return new Request("http://localhost/api/chat/stream", { method: "POST", body: form });
}

async function used() {
  const s = await getUsageSnapshot(quotaUser);
  return { chatMessages: s.used.chatMessages, chatImages: s.used.chatImages };
}

beforeAll(async () => {
  const db = getDb();
  const [row] = await db
    .insert(schema.users)
    .values({ email: quotaUser.email, password: "", name: "Тест", grade: 6 })
    .returning({ id: schema.users.id });
  quotaUser.id = row!.id;
  testUser.current = {
    id: row!.id,
    name: "Тест",
    email: quotaUser.email,
    grade: 6,
    avatar: "bear1",
    chatName: null,
    plan: "free",
    planExpiresAt: null,
    isAdmin: false,
    sessionVersion: 0,
  };
  sessionId = (await createChatSession({ userId: row!.id, subject: "math" }))!;
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("POST /api/chat/stream with a rejected image", () => {
  it("does not consume photo or message quota", async () => {
    const before = await used();
    expect(before).toEqual({ chatMessages: 0, chatImages: 0 });

    const gif = Buffer.from("R0lGODlhAQABAAAAACwAAAAAAQABAAA=", "base64");
    const r1 = await POST(imageRequest(gif, "a.gif", "image/gif"));
    expect(r1.status).toBe(400);
    expect(((await r1.json()) as { error: string }).error).toContain("JPEG, PNG или WebP");

    const fakePng = Buffer.from("definitely not a png");
    const r2 = await POST(imageRequest(fakePng, "fake.png", "image/png"));
    expect(r2.status).toBe(400);

    expect(await used()).toEqual(before);
  });

  it("still counts a valid image (control)", async () => {
    const png = await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();
    const res = await POST(imageRequest(png, "ok.png", "image/png"));
    expect(res.status).toBe(200);
    await res.text(); // дочитать поток
    expect(await used()).toEqual({ chatMessages: 1, chatImages: 1 });
  });
});
