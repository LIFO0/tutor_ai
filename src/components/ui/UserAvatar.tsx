"use client";

const AVATARS = ["bear1", "bear2", "bear3", "bear4"] as const;
export type AvatarId = (typeof AVATARS)[number];

export const AVATAR_IDS: readonly AvatarId[] = AVATARS;

const STYLES: Record<AvatarId, string> = {
  bear1: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  bear2: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  bear3: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  bear4: "bg-violet-500/15 text-violet-800 dark:text-violet-300",
};

const FACE: Record<AvatarId, string> = {
  bear1: "˘◡˘",
  bear2: "•‿•",
  bear3: "^ᴗ^",
  bear4: "•̀ᴗ•́",
};

function normalizeAvatar(avatar: string): AvatarId {
  return AVATARS.includes(avatar as AvatarId) ? (avatar as AvatarId) : "bear1";
}

export function UserAvatar({
  avatar,
  size = "md",
  className = "",
  selected = false,
}: {
  avatar: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Подсветка выбранного варианта (сетка настроек) */
  selected?: boolean;
}) {
  const id = normalizeAvatar(avatar);
  const dim =
    size === "sm"
      ? "h-8 w-8 min-h-8 min-w-8 text-[10px]"
      : size === "lg"
        ? "h-14 w-14 min-h-14 min-w-14 text-lg"
        : "h-9 w-9 min-h-9 min-w-9 text-xs";

  return (
    <div
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold shadow-sm ring-2 ring-transparent transition-[box-shadow,ring-color]",
        dim,
        STYLES[id],
        selected
          ? "ring-[color:var(--color-accent)] ring-offset-2 ring-offset-white dark:ring-offset-zinc-950"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <span className="select-none leading-none">{FACE[id]}</span>
    </div>
  );
}
