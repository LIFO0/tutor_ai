/** Client/server-safe constants for user-uploaded images (decoded server-side by safeSharp). */
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Value for `<input type="file" accept>`. */
export const IMAGE_INPUT_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");

export const UNSUPPORTED_IMAGE_MESSAGE =
  "Не удалось обработать изображение. Попробуй JPEG, PNG или WebP.";

/** Browser-reported MIME check (the server still sniffs magic bytes). */
export function isAllowedImageMime(type: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(type.toLowerCase());
}

export type SniffedImageFormat = "jpeg" | "png" | "webp";

/**
 * Формат по сигнатуре (magic bytes), не по расширению/MIME. Общий для сервера (safeSharp)
 * и клиента (проверка до отправки), чтобы «.png», который на деле не PNG, отсекался одинаково.
 */
export function sniffImageBytes(buf: Uint8Array): SniffedImageFormat | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return "png";
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...buf.subarray(from, to));
  if (buf.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

/**
 * Клиентская проверка файла перед отправкой: сигнатура JPEG/PNG/WebP и, если браузер умеет,
 * пробное декодирование (битый файл с правильной сигнатурой тоже отсекается).
 * Сервер всё равно проверяет сам; это только чтобы не создавать чат и не тратить запрос впустую.
 */
export async function isDecodableImageFile(file: Blob): Promise<boolean> {
  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  } catch {
    return false;
  }
  if (!sniffImageBytes(head)) return false;
  if (typeof createImageBitmap !== "function") return true;
  try {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
    return true;
  } catch {
    return false;
  }
}
