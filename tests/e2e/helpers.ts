import type { Page } from "@playwright/test";

interface StableFontScope {
  page: Page;
  url: string;
  viewport: { width: number; height: number };
  fullPage?: boolean;
}

/**
 * Forces web fonts to a fixed system fallback for the whole page lifetime, so
 * font swapping cannot change metrics between runs. Applied before navigation.
 * Visual regression keeps checking layout, spacing, color and hierarchy; the
 * real typefaces are reviewed in the `docs/design-qa` screenshots.
 */
export async function useStableFonts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = `html, body, h1, h2, h3, h4, h5, p, a, button, strong, span, small, dt, dd, li, ul, ol, figcaption, label, input, textarea { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important; }`;
    document.head.appendChild(style);
  });
}

/** Deterministic state before screenshots: settled reveals, eager + decoded images. */
export async function settlePage(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const image of document.images) {
      image.loading = "eager";
    }
    for (const element of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      element.classList.add("is-visible");
    }
  });
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(images.map((image) => image.decode().catch(() => {})));
  });
}

/** Navigates, settles state and captures a deterministic screenshot value. */
export async function capture(page: Page, scope: StableFontScope): Promise<Buffer> {
  await useStableFonts(page);
  await page.setViewportSize(scope.viewport);
  await page.goto(scope.url, { waitUntil: "networkidle" });
  await settlePage(page);
  return page.screenshot({ fullPage: scope.fullPage ?? false });
}
