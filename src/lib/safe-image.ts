import sharp from "sharp";
import { sniffImageBytes } from "@/lib/image-formats";

/**
 * Только JPEG, PNG и WebP по сигнатуре файла (не по MIME из браузера).
 * SVG, HEIF, TIFF и прочее до декодеров libvips не доходят (аудит 22.10, H3).
 */
export type SafeImageFormat = "jpeg" | "png" | "webp";

export function sniffImageFormat(buf: Buffer): SafeImageFormat | null {
  return sniffImageBytes(buf);
}

/** ~40 Мп: хватает для фото с телефона, отсекает «бомбы» по размеру. */
export const SAFE_IMAGE_MAX_PIXELS = 40_000_000;

export class UnsupportedImageError extends Error {}

/** sharp-пайплайн только для проверенных форматов. */
export function safeSharp(buf: Buffer): ReturnType<typeof sharp> {
  if (!sniffImageFormat(buf)) throw new UnsupportedImageError("Поддерживаются только JPEG, PNG и WebP.");
  return sharp(buf, { limitInputPixels: SAFE_IMAGE_MAX_PIXELS, failOn: "error" });
}
