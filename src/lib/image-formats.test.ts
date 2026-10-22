import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { isDecodableImageFile, sniffImageBytes } from "@/lib/image-formats";

const base = () => sharp({ create: { width: 4, height: 4, channels: 3, background: "#f00" } });

describe("sniffImageBytes", () => {
  it("recognises JPEG, PNG and WebP by signature", async () => {
    expect(sniffImageBytes(new Uint8Array(await base().jpeg().toBuffer()))).toBe("jpeg");
    expect(sniffImageBytes(new Uint8Array(await base().png().toBuffer()))).toBe("png");
    expect(sniffImageBytes(new Uint8Array(await base().webp().toBuffer()))).toBe("webp");
  });

  it("rejects GIF, text and truncated headers", async () => {
    expect(sniffImageBytes(new Uint8Array(await base().gif().toBuffer()))).toBeNull();
    expect(sniffImageBytes(new TextEncoder().encode("notreallypng"))).toBeNull();
    expect(sniffImageBytes(new Uint8Array([0x89, 0x50, 0x4e]))).toBeNull();
    expect(sniffImageBytes(new Uint8Array())).toBeNull();
  });
});

describe("isDecodableImageFile", () => {
  it("accepts a real PNG and rejects a fake .png and a GIF", async () => {
    const png = new Blob([new Uint8Array(await base().png().toBuffer())], { type: "image/png" });
    const fake = new Blob(["notreallypng"], { type: "image/png" });
    const gif = new Blob([new Uint8Array(await base().gif().toBuffer())], { type: "image/png" });
    expect(await isDecodableImageFile(png)).toBe(true);
    expect(await isDecodableImageFile(fake)).toBe(false);
    expect(await isDecodableImageFile(gif)).toBe(false);
  });
});
