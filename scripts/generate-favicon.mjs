import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const repoRoot = path.resolve(import.meta.dirname, "..");
const inputPath = path.join(repoRoot, "public", "avatars", "av_main.png");
const outDir = path.join(repoRoot, "public");
const appDir = path.join(repoRoot, "src", "app");

async function writePng(name, size) {
  const outPath = path.join(outDir, name);
  const buf = await sharp(inputPath)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.writeFile(outPath, buf);
  return buf;
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(appDir, { recursive: true });

  const png16 = await writePng("favicon-16x16.png", 16);
  const png32 = await writePng("favicon-32x32.png", 32);
  const png48 = await writePng("favicon-48x48.png", 48);

  const apple180 = await writePng("apple-touch-icon.png", 180);
  await fs.writeFile(path.join(outDir, "icon-192.png"), await sharp(apple180).resize(192, 192).png().toBuffer());
  await fs.writeFile(path.join(outDir, "icon-512.png"), await sharp(apple180).resize(512, 512).png().toBuffer());

  const ico = await pngToIco([png16, png32, png48]);
  await fs.writeFile(path.join(outDir, "favicon.ico"), ico);

  // Next.js App Router "special files" (more reliable than relying on <link> caching)
  await fs.writeFile(path.join(appDir, "favicon.ico"), ico);

  const iconPng = await sharp(inputPath)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.writeFile(path.join(appDir, "icon.png"), iconPng);

  const applePng = await sharp(inputPath)
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.writeFile(path.join(appDir, "apple-icon.png"), applePng);
}

await main();
