import Image from "next/image";
import Link from "next/link";

const subjects = [
  {
    name: "Математика",
    icon: "/landing/icon_sigma.png",
    iconClassName: "h-5 w-5",
    href: "/repetitor-po-matematike",
    alt: "Математика онлайн",
  },
  {
    name: "Физика",
    icon: "/landing/icon_physics.png",
    iconClassName: "h-6 w-6",
    href: "/repetitor-po-fizike",
    alt: "Физика онлайн",
  },
  {
    name: "Русский язык",
    icon: "/landing/icon_a.png",
    iconClassName: "h-6 w-6",
    href: "/repetitor-po-russkomu-yazyku",
    alt: "Русский язык онлайн",
  },
  {
    name: "Свободная тема",
    icon: "/landing/icon_sparkler.png",
    iconClassName: "h-6 w-6",
    href: "/login",
    alt: "Любые школьные вопросы",
  },
];

export function SubjectsMarquee() {
  return (
    <section
      className="border-y border-border/50 bg-muted/30 py-8 md:py-12"
      aria-label="Доступные предметы"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {subjects.map((subject) => (
            <Link
              key={subject.name}
              href={subject.href}
              className="flex items-center gap-3 font-display text-lg font-semibold text-muted-foreground transition-colors hover:text-foreground md:text-xl"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background">
                <Image
                  src={subject.icon}
                  alt={subject.alt}
                  width={32}
                  height={32}
                  className={`${subject.iconClassName} object-contain`}
                />
              </span>
              <span>{subject.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
