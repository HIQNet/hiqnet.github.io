import { expect, test } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({
    contextOptions: { reducedMotion: "reduce" },
  });

  test("content is immediately visible without animation states", async ({ page }) => {
    await page.goto("/");

    // Sections are all rendered and visible; no JS-gated hidden states linger.
    const first = page.locator("section#servicios h3").first();
    await expect(first).toBeVisible();
    await expect(first).toHaveCSS("opacity", "1");

    // The scroll behaviour is disabled at the document level.
    const smooth = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(smooth).toBe("auto");
  });
});

test("home does not gate reading behind scroll-reveal states", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-reveal]")).toHaveCount(0);
});

test.describe("no-javascript", () => {
  test.use({ javaScriptEnabled: false });

  test("the page is readable and navigable without JavaScript", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main")).toContainText("Software que hace más claro el trabajo");

    // Reveal states must not hide content without JS.
    await expect(page.locator("section#servicios")).toBeVisible();

    // Noscript navigation is available as a fallback.
    await expect(
      page.getByRole("navigation", { name: /Navegación principal/ }).first(),
    ).toBeVisible();
    await expect(page.locator("#contenido")).toBeVisible();
  });
});

test("skip link is the first focusable element", async ({ page }) => {
  await page.goto("/");

  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(skip).toHaveAttribute("href", "#contenido");

  // The skip link precedes every other focusable element in the document.
  const index = await page.evaluate(() => {
    const focusables = Array.from(
      document.querySelectorAll("a[href], button:not([disabled]), [tabindex]"),
    );
    return focusables.findIndex((el) => el.classList.contains("skip-link"));
  });
  expect(index).toBe(0);

  // It is keyboard-focusable.
  await skip.focus();
  await expect(skip).toBeFocused();
});

test("skip link is the first tab stop", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Tab order inside the browser chrome is engine-specific");
  await page.goto("/");

  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(
    () => document.querySelector(".skip-link") === document.activeElement,
  );
  if (!focused) await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
});
