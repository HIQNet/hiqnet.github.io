import sharp from "sharp";

const [referencePath, implementationPath, outputPath] = process.argv.slice(2);

if (!referencePath || !implementationPath || !outputPath) {
  throw new Error("Usage: node scripts/compare-design.mjs <reference> <implementation> <output>");
}

const columnWidth = 720;
const [reference, implementation] = await Promise.all(
  [referencePath, implementationPath].map((path) =>
    sharp(path).resize({ width: columnWidth }).png().toBuffer({ resolveWithObject: true }),
  ),
);

await sharp({
  create: {
    width: columnWidth * 2,
    height: Math.max(reference.info.height, implementation.info.height),
    channels: 4,
    background: "#0a0c0f",
  },
})
  .composite([
    { input: reference.data, left: 0, top: 0 },
    { input: implementation.data, left: columnWidth, top: 0 },
  ])
  .png()
  .toFile(outputPath);
