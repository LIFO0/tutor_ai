import { isUserAuthenticated } from "@/lib/current-user";
import { LandingHeaderClient } from "@/components/landing/landing-header-client";

/**
 * Публичная фиксированная шапка. По умолчанию добавляет спейсер высотой с шапку,
 * чтобы контент страницы не уезжал под неё. `overlay` — для hero-страниц,
 * которые сами задают верхний отступ (pt-28 / md:pt-36).
 */
export default async function Header({ overlay = false }: { overlay?: boolean } = {}) {
  const isAuthenticated = await isUserAuthenticated();
  return <LandingHeaderClient isAuthenticated={isAuthenticated} overlay={overlay} />;
}
