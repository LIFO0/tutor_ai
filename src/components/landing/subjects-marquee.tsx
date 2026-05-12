import Image from "next/image";

const subjects = [
  { name: "Математика", icon: "/landing/icon_sigma.png", iconClassName: "h-5 w-5" },
  { name: "Физика", icon: "/landing/icon_physics.png", iconClassName: "h-6 w-6" },
  { name: "Русский язык", icon: "/landing/icon_a.png", iconClassName: "h-6 w-6" },
  { name: "Свободная тема", icon: "/landing/icon_sparkler.png", iconClassName: "h-6 w-6" },
];

export function SubjectsMarquee() {
  return (
    <section className="border-y border-border/50 bg-muted/30 py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {subjects.map((subject) => (
            <div
              key={subject.name}
              className="flex items-center gap-3 font-display text-lg font-semibold text-muted-foreground md:text-xl"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background">
                <Image
                  src={subject.icon}
                  alt=""
                  width={32}
                  height={32}
                  className={`${subject.iconClassName} object-contain`}
                />
              </span>
              <span>{subject.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
