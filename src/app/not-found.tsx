import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="landing-light-theme flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 pb-12 pt-24 text-center sm:px-6 sm:pb-16 md:pt-32">
        <Image
          src="/bears/bear_thinking.webp"
          alt="Мишка задумался"
          width={720}
          height={960}
          priority
          className="mb-6 h-56 w-auto max-w-full object-contain sm:h-72"
        />
        <p className="mb-2 text-sm font-semibold text-primary">Ошибка 404</p>
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Такой страницы нет</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          Мишка поискал везде, но не нашёл эту страницу. Возможно, ссылка устарела или в адресе
          опечатка.
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/">На главную</Link>
        </Button>
      </div>
      <Footer />
    </main>
  );
}
