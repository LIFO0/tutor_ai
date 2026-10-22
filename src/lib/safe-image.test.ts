import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { safeSharp, sniffImageFormat, UnsupportedImageError } from "@/lib/safe-image";

describe("sniffImageFormat", () => {
  it("detects jpeg, png and webp", async () => {
    const base = sharp({ create: { width: 2, height: 2, channels: 3, background: "#fff" } });
    expect(sniffImageFormat(await base.clone().jpeg().toBuffer())).toBe("jpeg");
    expect(sniffImageFormat(await base.clone().png().toBuffer())).toBe("png");
    expect(sniffImageFormat(await base.clone().webp().toBuffer())).toBe("webp");
  });

  it("rejects svg, gif, heif-like and garbage", () => {
    expect(sniffImageFormat(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(sniffImageFormat(Buffer.from("GIF89a\x01\x00\x01\x00"))).toBeNull();
    expect(sniffImageFormat(Buffer.from("\x00\x00\x00\x18ftypheic\x00\x00\x00\x00", "binary"))).toBeNull();
    expect(sniffImageFormat(Buffer.alloc(0))).toBeNull();
  });

  it("safeSharp throws on unsupported input", () => {
    expect(() => safeSharp(Buffer.from("<svg/>"))).toThrow(UnsupportedImageError);
  });
});
