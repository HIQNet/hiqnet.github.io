import { expect, test } from "@playwright/test";

test.describe("runtime diagnostics", () => {
  for (const url of ["/", "/casos/la-terraza/", "/casos/numeriq/"]) {
    test(`no console or runtime errors on ${url}`, async ({ page }) => {
      const problems: string[] = [];

      page.on("console", (message) => {
        if (message.type() === "error") problems.push(`console.error: ${message.text()}`);
      });
      page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));

      await page.goto(url);
      // Let deferred islands and observers run their initial pass.
      await page.waitForTimeout(400);
      // Trigger the deferred GSAP import and any scroll-driven work.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, 0));

      expect(problems).toEqual([]);
    });
  }
});
