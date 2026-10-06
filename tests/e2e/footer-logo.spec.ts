import { expect, test } from "@playwright/test";

for (const route of ["/", "/casos/la-terraza/"]) {
  for (const width of [390, 768, 1440]) {
    test(`footer logo fits its ${route === "/" ? "compact" : "spacious"} layout on ${route} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);

      const logo = page.locator("footer .footer__logo");
      await logo.scrollIntoViewIfNeeded();
      await logo.evaluate((image: HTMLImageElement) => image.decode());

      const box = await logo.boundingBox();
      expect(box).not.toBeNull();
      const ratio = box!.width / box!.height;
      if (route === "/") {
        expect(box!.height).toBeGreaterThanOrEqual(46);
        expect(ratio).toBeGreaterThan(2.9);
        expect(ratio).toBeLessThan(3.1);
      } else {
        expect(box!.height).toBeGreaterThanOrEqual(170);
        expect(ratio).toBeGreaterThan(0.75);
        expect(ratio).toBeLessThan(0.85);
      }

      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(pageWidth).toBeLessThanOrEqual(width);
    });
  }
}

for (const route of ["/", "/casos/la-terraza/"]) {
  for (const width of [320, 390]) {
    test(`footer brand is centered on ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route);

      const logo = page.locator("footer .footer__logo");
      await logo.scrollIntoViewIfNeeded();
      const box = await logo.boundingBox();
      expect(box).not.toBeNull();
      expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThanOrEqual(2);

      if (route === "/") {
        const nav = page.getByRole("navigation", { name: "Navegación del pie de página" });
        const navBox = await nav.boundingBox();
        expect(navBox).not.toBeNull();
        expect(Math.abs(navBox!.x + navBox!.width / 2 - width / 2)).toBeLessThanOrEqual(2);
      }
    });
  }
}
