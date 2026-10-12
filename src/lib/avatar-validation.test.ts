import { describe, expect, it } from "vitest";
import { isSafeAvatarFilename, isValidAvatar, uploadedAvatarFilenameFromUrl, uploadedAvatarPathFromUrl } from "@/lib/avatar-validation";

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
    expect(
      isValidAvatar(
        "https://avatars.yandex.net/get-yapic/41418%2F5093570536-313109/islands-200",
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

describe("avatar filenames", () => {
  it("safe filename", () => {
    expect(isSafeAvatarFilename("123e4567-e89b-42d3-a456-426614174000.png")).toBe(true);
    expect(isSafeAvatarFilename("user-12.png")).toBe(true);
    expect(isSafeAvatarFilename("../etc/passwd")).toBe(false);
    expect(isSafeAvatarFilename("x.png")).toBe(false);
    expect(isSafeAvatarFilename("user-1.png/../a")).toBe(false);
  });
  it("from url", () => {
    expect(uploadedAvatarFilenameFromUrl("/uploads/avatars/user-3.png?v=123")).toBe("user-3.png");
    expect(uploadedAvatarFilenameFromUrl("bear1")).toBeNull();
    expect(uploadedAvatarFilenameFromUrl(null)).toBeNull();
  });
});
