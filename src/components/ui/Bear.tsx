export function Bear({ mood = "normal" }: { mood?: "normal" | "think" | "yay" | "explain" }) {
  const face =
    mood === "think"
      ? "•_•"
      : mood === "yay"
        ? "ˆ‿ˆ"
        : mood === "explain"
          ? "•︵•"
          : "˘◡˘";

  return (
    <div
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)] select-none"
      aria-label="Мишка"
      title="Мишка знает"
    >
      <span className="text-xs font-semibold">{face}</span>
    </div>
  );
}

