/** Counter ID from Yandex Metrika dashboard. Override via NEXT_PUBLIC_YANDEX_METRIKA_ID. */
export const YANDEX_METRIKA_ID = Number(
  process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID?.trim() || "109525941",
);

export function isYandexMetrikaEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_YANDEX_METRIKA_DISABLED === "1") return false;
  return Number.isFinite(YANDEX_METRIKA_ID) && YANDEX_METRIKA_ID > 0;
}
