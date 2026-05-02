"use client";

import Image from "next/image";

export type BearTotemVariant = "welcoming" | "standard" | "thinking";

const SRC: Record<BearTotemVariant, string> = {
  welcoming: "/bears/bear_welcoming.png",
  standard: "/bears/bear_main.png",
  thinking: "/bears/bear_thinking.png",
};

const ALT: Record<BearTotemVariant, string> = {
  welcoming: "Мишка приветствует",
  standard: "Мишка",
  thinking: "Мишка думает",
};

export function BearTotem({
  variant,
  className = "",
  size = "md",
  priority = false,
}: {
  variant: BearTotemVariant;
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}) {
  const dim =
    size === "sm" ? { w: 120, h: 120, cls: "h-[120px] w-[120px]" } : size === "lg" ? { w: 220, h: 220, cls: "h-[220px] w-[220px]" } : { w: 168, h: 168, cls: "h-[168px] w-[168px]" };

  return (
    <div className={["relative shrink-0 select-none", dim.cls, className].filter(Boolean).join(" ")}>
      <Image
        src={SRC[variant]}
        alt={ALT[variant]}
        width={dim.w}
        height={dim.h}
        className="h-full w-full object-contain object-center drop-shadow-sm"
        priority={priority}
        sizes={`${dim.w}px`}
      />
    </div>
  );
}
