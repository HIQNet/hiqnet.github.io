import { expect, test } from "@playwright/test";
import { settlePage, useStableFonts } from "./helpers";

const SNAPSHOT_TIMEOUT = 20_000;

const fullPages = [
  { width: 390, height: 844, label: "390" },
  { width: 768, height: 1024, label: "768" },
  { width: 1440, height: 900, label: "1440" },
];

const homeSections: ReadonlyArray<{ id: string; label: string }> = [
  { id: "inicio", label: "hero" },
  { id: "servicios", label: "services" },
  { id: "enfoque", label: "approach" },
  { id: "casos", label: "work" },
  { id: "contacto", label: "contact" },
];

for (const viewport of fullPages) {
  test(`home full page @${viewport.label}`, async ({ page }) => {
    await useStableFonts(page);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await settlePage(page);
    await expect(page).toHaveScreenshot(`home-full-${viewport.label}.png`, {
      fullPage: true,
      timeout: SNAPSHOT_TIMEOUT,
    });
  });
}

for (const section of homeSections) {
  test(`home ${section.label} @1440`, async ({ page }) => {
    await useStableFonts(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await settlePage(page);
    await expect(page.locator(`section#${section.id}`)).toHaveScreenshot(
      `home-${section.label}-1440.png`,
      { timeout: SNAPSHOT_TIMEOUT },
    );
  });
}

test("case page @1440", async ({ page }) => {
  await useStableFonts(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/casos/la-terraza/");
  await settlePage(page);
  await expect(page).toHaveScreenshot("case-full-1440.png", {
    fullPage: true,
    timeout: SNAPSHOT_TIMEOUT,
  });
});

test("case page @390", async ({ page }) => {
  await useStableFonts(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/casos/la-terraza/");
  await settlePage(page);
  await expect(page).toHaveScreenshot("case-full-390.png", {
    fullPage: true,
    timeout: SNAPSHOT_TIMEOUT,
  });
});
