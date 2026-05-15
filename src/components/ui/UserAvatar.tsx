"use client";

const AVATARS = ["bear1", "bear2", "bear3", "bear4"] as const;
export type AvatarId = (typeof AVATARS)[number];

export const AVATAR_IDS: readonly AvatarId[] = AVATARS;

const STYLES: Record<AvatarId, string> = {
  bear1: "bg-[#ffd6a8] text-[#5c4033]",
  bear2: "bg-[#cfe8ff] text-[#2a3d52]",
  bear3: "bg-[#bff0d6] text-[#1e4a38]",
  bear4: "bg-[#ddd6ff] text-[#3d3358]",
};

function BuiltinFaceIcon({ id }: { id: AvatarId }) {
  const common = {
    viewBox: "0 0 40 40",
    className: "block h-[66%] w-[66%] shrink-0",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.85,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (id) {
    case "bear1":
      /* Закрытые глаза (дуги) + улыбка */
      return (
        <svg {...common}>
          <path d="M10.5 17.5q3.2-2.2 6.5 0" />
          <path d="M23 17.5q3.2-2.2 6.5 0" />
          <path d="M12.5 25.5c2.1 2.6 5.1 4 7.5 4s5.4-1.4 7.5-4" />
        </svg>
      );
    case "bear2":
      /* Точки + улыбка */
      return (
        <svg {...common}>
          <circle cx="13.5" cy="17.5" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="26.5" cy="17.5" r="2.2" fill="currentColor" stroke="none" />
          <path d="M12 25.5c2.3 2.3 5.4 3.6 8 3.6s5.7-1.3 8-3.6" />
        </svg>
      );
    case "bear3":
      /* Глаза «^» + улыбка */
      return (
        <svg {...common}>
          <path d="M10.5 18.5L13.5 14l3 4.5" />
          <path d="M23.5 18.5L26.5 14l3 4.5" />
          <path d="M12 26c2.2 2.4 5.3 3.8 8 3.8s5.8-1.4 8-3.8" />
        </svg>
      );
    case "bear4":
      /* Глаза «v» + улыбка */
      return (
        <svg {...common}>
          <path d="M11 15.5L13.5 19.5L16 15.5" />
          <path d="M24 15.5L26.5 19.5L29 15.5" />
          <path d="M12.5 25.5c2.1 2.5 5.1 4 7.5 4s5.4-1.5 7.5-4" />
        </svg>
      );
    default:
      return null;
  }
}

function normalizeAvatar(avatar: string): AvatarId {
  return AVATARS.includes(avatar as AvatarId) ? (avatar as AvatarId) : "bear1";
}

function isImageAvatar(avatar: string) {
  return avatar.startsWith("/uploads/avatars/") || avatar.startsWith("http://") || avatar.startsWith("https://");
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
  const dim =
    size === "sm"
      ? "h-8 w-8 min-h-8 min-w-8 text-[10px]"
      : size === "lg"
        ? "h-14 w-14 min-h-14 min-w-14 text-lg"
        : "h-9 w-9 min-h-9 min-w-9 text-xs";

  if (isImageAvatar(avatar)) {
    return (
      <div
        className={[
          "inline-flex shrink-0 overflow-hidden rounded-full bg-zinc-200 shadow-sm ring-2 ring-transparent transition-[box-shadow,ring-color] dark:bg-zinc-800",
          dim,
          selected
            ? "ring-[color:var(--color-accent)] ring-offset-2 ring-offset-white dark:ring-offset-zinc-950"
            : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden
      >
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  const id = normalizeAvatar(avatar);
  return (
    <div
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium shadow-none ring-2 ring-transparent transition-[box-shadow,ring-color]",
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
      <BuiltinFaceIcon id={id} />
    </div>
  );
}

/** Плитка регистрации: квадрат с рамкой; внутри — круглый UserAvatar */
export function AvatarPickerTile({
  id,
  selected,
  onClick,
}: {
  id: AvatarId;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative box-border flex aspect-square w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl bg-white transition-colors",
        selected
          ? "border-2 border-[color:var(--color-accent)] shadow-sm"
          : "border-2 border-zinc-200/95 hover:border-zinc-300",
      ].join(" ")}
      aria-pressed={selected}
      aria-label={`Аватар ${id.slice(-1)}`}
    >
      <span className="pointer-events-none flex h-[88%] w-[88%] max-h-[6.25rem] max-w-[6.25rem] items-center justify-center sm:h-[90%] sm:w-[90%] sm:max-h-[6.5rem] sm:max-w-[6.5rem]">
        <UserAvatar
          avatar={id}
          size="lg"
          selected={false}
          className="!h-full !w-full !min-h-0 !min-w-0 !shadow-none ring-0 ring-offset-0"
        />
      </span>
    </button>
  );
}
