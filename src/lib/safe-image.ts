import sharp from "sharp";

/**
 * Только JPEG, PNG и WebP по сигнатуре файла (не по MIME из браузера).
 * SVG, HEIF, TIFF и прочее до декодеров libvips не доходят (аудит 22.10, H3).
 */
export type SafeImageFormat = "jpeg" | "png" | "webp";

export function sniffImageFormat(buf: Buffer): SafeImageFormat | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return "png";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

/** ~40 Мп: хватает для фото с телефона, отсекает «бомбы» по размеру. */
export const SAFE_IMAGE_MAX_PIXELS = 40_000_000;

export class UnsupportedImageError extends Error {}

/** sharp-пайплайн только для проверенных форматов. */
export function safeSharp(buf: Buffer): ReturnType<typeof sharp> {
  if (!sniffImageFormat(buf)) throw new UnsupportedImageError("Поддерживаются только JPEG, PNG и WebP.");
  return sharp(buf, { limitInputPixels: SAFE_IMAGE_MAX_PIXELS, failOn: "error" });
}
