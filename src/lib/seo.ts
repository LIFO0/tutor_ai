export const SITE_ORIGIN = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://mishkaznaet.ru";

export const SITE_NAME = "Мишка знает";

export const DEFAULT_TITLE = "Мишка знает — ИИ-репетитор для школьников 5–11 класса";

export const DEFAULT_DESCRIPTION =
  "Мишка знает — бесплатный ИИ-репетитор для школьников 5–11 класса. Объясняет математику, физику и русский язык простым языком, шаг за шагом. Доступен 24/7 прямо в браузере.";

export const OG_TITLE = "Мишка знает — ИИ-репетитор для школьников";

export const OG_DESCRIPTION =
  "Персональный ИИ-репетитор для школьников 5–11 класса. Математика, физика, русский язык — объяснения простым языком, шаг за шагом.";

/** Картинка из `app/opengraph-image.tsx`. Путь без `.png`: так её отдаёт Next.js. */
export const OG_IMAGE_PATH = "/opengraph-image";

export const OG_IMAGE = {
  url: OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: DEFAULT_TITLE,
  type: "image/png",
} as const;

/** RDFa-префиксы для валидатора Яндекса: `og:` он знает сам, `article:` — нет. */
export const HTML_RDFA_PREFIX = "og: http://ogp.me/ns# article: http://ogp.me/ns/article#";

export const SEO_KEYWORDS = [
  "ИИ репетитор",
  "репетитор онлайн",
  "репетитор для школьников",
  "ИИ репетитор для школьников",
  "онлайн репетитор бесплатно",
  "репетитор по математике онлайн",
  "репетитор по физике онлайн",
  "помощь с домашним заданием",
  "ОГЭ репетитор",
  "ЕГЭ репетитор",
  "искусственный интеллект учёба",
];
