import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Мишка знает — ИИ-репетитор для школьников 5–11 класса";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [avatarData, fontData] = await Promise.all([
    readFile(join(process.cwd(), "public/avatars/av_main.png")),
    readFile(join(process.cwd(), "public/fonts/Manrope-Bold.ttf")),
  ]);

  const avatarSrc = `data:image/png;base64,${avatarData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "60px 80px",
          fontFamily: "Manrope",
        }}
      >
        {/* top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "#e07a2f",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 52 }}>
          {/* Bear avatar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 176,
              height: 176,
              borderRadius: "50%",
              background: "#fef3e2",
              flexShrink: 0,
              border: "4px solid #fde8c3",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc}
              width={128}
              height={128}
              alt=""
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          </div>

          {/* Text block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#e07a2f",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              mishkaznaet.ru
            </div>
            <div
              style={{
                fontSize: 68,
                fontWeight: 800,
                color: "#171717",
                lineHeight: 1.05,
              }}
            >
              Мишка знает
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 400, color: "#6b7280", lineHeight: 1.4 }}>
                ИИ-репетитор для школьников 5–11 класса
              </div>
              <div style={{ fontSize: 22, fontWeight: 400, color: "#9ca3af" }}>
                Математика · Физика · Русский язык · Бесплатно
              </div>
            </div>
          </div>
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: 52,
            right: 80,
            display: "flex",
            alignItems: "center",
            padding: "10px 24px",
            borderRadius: 100,
            background: "#fef3e2",
            border: "1px solid #fde8c3",
            fontSize: 22,
            fontWeight: 600,
            color: "#9a4b0f",
          }}
        >
          Бесплатно · 24/7
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Manrope",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
