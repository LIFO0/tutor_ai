import { describe, expect, it } from "vitest";
import { isValidAvatar, uploadedAvatarPathFromUrl } from "@/lib/avatar-validation";

describe("isValidAvatar", () => {
  it("accepts built-in bears", () => {
    expect(isValidAvatar("bear1")).toBe(true);
    expect(isValidAvatar("bear5")).toBe(false);
  });

  it("accepts uuid and legacy upload paths", () => {
    expect(
      isValidAvatar(
        "/uploads/avatars/550e8400-e29b-41d4-a716-446655440000.png?v=123",
      ),
    ).toBe(true);
    expect(isValidAvatar("/uploads/avatars/user-42.png")).toBe(true);
    expect(isValidAvatar("https://evil.com/x.png")).toBe(false);
  });

  it("accepts yandex avatars only from allowlisted host", () => {
    expect(
      isValidAvatar(
        "https://avatars.yandex.net/get-yapic/abc/islands-200",
      ),
    ).toBe(true);
  });
});

describe("uploadedAvatarPathFromUrl", () => {
  it("strips query string", () => {
    expect(
      uploadedAvatarPathFromUrl("/uploads/avatars/uuid.png?v=1"),
    ).toBe("/uploads/avatars/uuid.png");
  });
});
