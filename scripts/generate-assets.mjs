/**
 * Generates static brand assets (OG image, favicon, apple touch icon) from the
 * source brand files. Run manually after changing the brand assets:
 *
 *   node scripts/generate-assets.mjs
 *
 * Outputs are committed to `public/` so the build does not depend on this step.
 */
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const BRAND_LOGO = "src/assets/brand/hiqnet-logo.webp";
const BRAND_ICON = "src/assets/brand/hiqnet-icon.png";

const BG = "#0a0c0f";
const ACCENT = "#2ad1f2";

async function generateOg() {
  const width = 1200;
  const height = 630;
  const logo = await sharp(BRAND_LOGO)
    .resize({ width: 760, fit: "inside", withoutEnlargement: true })
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoWidth = logoMeta.width ?? 0;
  const logoHeight = logoMeta.height ?? 0;
  const top = Math.round((height - logoHeight) / 2) - 24;
  const ruleWidth = 72;
  const rule = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${(width - ruleWidth) / 2}" y="${top + logoHeight + 56}" width="${ruleWidth}" height="2" fill="${ACCENT}" />
    </svg>`,
  );

  return sharp({
    create: { width, height, channels: 4, background: BG },
  })
    .composite([
      { input: logo, left: Math.round((width - logoWidth) / 2), top },
      { input: rule, left: 0, top: 0 },
    ])
    .png({ quality: 90 })
    .toFile("public/og.png");
}

async function generateIcon(size, file) {
  const mark = sharp(BRAND_ICON)
    .trim()
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  return mark.png().toFile(file);
}

async function main() {
  await mkdir("public", { recursive: true });
  await Promise.all([
    generateOg(),
    generateIcon(64, "public/favicon.png"),
    generateIcon(180, "public/apple-touch-icon.png"),
  ]);
  console.log(
    "Brand assets generated: public/og.png, public/favicon.png, public/apple-touch-icon.png",
  );
}

await main();
