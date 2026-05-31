"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useCookieConsent } from "@/components/cookie/CookieConsentProvider";
import { isYandexMetrikaEnabled, YANDEX_METRIKA_ID } from "@/lib/yandex-metrika";

function YandexMetrikaPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    if (typeof window.ym === "function") {
      window.ym(YANDEX_METRIKA_ID, "hit", url);
    }
  }, [pathname, searchParams]);

  return null;
}

export function YandexMetrika() {
  const { consent } = useCookieConsent();

  if (!isYandexMetrikaEnabled() || consent !== "all") return null;

  const id = YANDEX_METRIKA_ID;
  const tagSrc = `https://mc.yandex.ru/metrika/tag.js?id=${id}`;

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document, "script", "${tagSrc}", "ym");

ym(${id}, "init", {
  ssr: true,
  webvisor: true,
  clickmap: true,
  ecommerce: "dataLayer",
  accurateTrackBounce: true,
  trackLinks: true
});
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
      <YandexMetrikaPageViews />
    </>
  );
}
