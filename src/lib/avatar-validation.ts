/** Allowlist for profile/register avatar values (built-in, uploads, Yandex). */

const BUILTIN_AVATAR = /^bear[1-4]$/;
const UPLOADED_AVATAR =
  /^\/uploads\/avatars\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|user-\d+)\.png(\?v=\d+)?$/i;
const YANDEX_AVATAR =
  /^https:\/\/avatars\.yandex\.net\/get-yapic\/[a-zA-Z0-9._%-]+\/islands-(small|34|middle|50|retina-small|68|75|retina-middle|retina-50|200)$/;

export function isValidAvatar(avatar: string): boolean {
  return (
    BUILTIN_AVATAR.test(avatar) || UPLOADED_AVATAR.test(avatar) || YANDEX_AVATAR.test(avatar)
  );
}

/** Path under public/ for a stored upload avatar, without query string. */
export function uploadedAvatarPathFromUrl(avatar: string): string | null {
  const m = avatar.match(/^(\/uploads\/avatars\/[^?]+\.png)/i);
  return m?.[1] ?? null;
}

const SAFE_AVATAR_FILENAME =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|user-\d+)\.png$/i;

/** Filename (no dirs) of an uploaded avatar: UUID.png or user-<id>.png. */
export function isSafeAvatarFilename(name: string): boolean {
  return SAFE_AVATAR_FILENAME.test(name);
}

/** Filename part of a stored upload avatar URL (/uploads/avatars/<file>.png?v=…). */
export function uploadedAvatarFilenameFromUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  const p = uploadedAvatarPathFromUrl(avatar);
  if (!p) return null;
  const name = p.slice("/uploads/avatars/".length);
  return isSafeAvatarFilename(name) ? name : null;
}
