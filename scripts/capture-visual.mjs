import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const outputDirectory = path.resolve(".visual-regression");
const pages = ["/index.html", "/pages/about-bienesRaices.html", "/pages/about-gestion-medica.html", "/pages/about-laTerraza.html", "/pages/about-SWI.html", "/pages/about-webService.html"];
const viewports = [1440, 1024, 768, 390];
const targets = [
  ["legacy", "http://127.0.0.1:4173"],
  ["astro", "http://127.0.0.1:4174"],
];

await rm(outputDirectory, { force: true, recursive: true });
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  for (const [targetName, baseUrl] of targets) {
    for (const pagePath of pages) {
      for (const width of viewports) {
        const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
        await page.goto(`${baseUrl}${pagePath}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          fullPage: true,
          path: path.join(outputDirectory, `${targetName}-${pagePath.replaceAll("/", "_").replace(".html", "")}-${width}.png`),
        });
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
