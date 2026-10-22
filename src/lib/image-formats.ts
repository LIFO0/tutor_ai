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
