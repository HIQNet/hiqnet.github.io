import { expect, test } from "@playwright/test";

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens and closes the panel", async ({ page }) => {
    await page.goto("/");

    const toggle = page.getByRole("button", { name: "Abrir menú" });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const panel = page.getByRole("dialog", { name: "Menú de navegación" });
    await expect(panel).toBeVisible();

    // Focus lands on the first navigation link inside the panel.
    await expect(
      panel
        .getByRole("navigation", { name: "Navegación móvil" })
        .getByRole("link", { name: "Qué hacemos" }),
    ).toBeFocused();

    // Escape closes the panel and returns focus to the toggle.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
    await expect(page.getByRole("dialog", { name: "Menú de navegación" })).toBeHidden();
  });

  test("panel links point to the page anchors", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();

    const panel = page.getByRole("dialog", { name: "Menú de navegación" });
    for (const label of ["Qué hacemos", "Cómo trabajamos", "Casos", "Contacto"]) {
      await expect(
        panel
          .getByRole("navigation", { name: "Navegación móvil" })
          .getByRole("link", { name: label }),
      ).toBeVisible();
    }
    await expect(
      panel
        .getByRole("navigation", { name: "Navegación móvil" })
        .getByRole("link", { name: /Hablemos por WhatsApp/ }),
    ).toHaveAttribute("href", /^https:\/\/wa\.me\//);
  });
});

test.describe("desktop navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("mobile toggle is not rendered on desktop", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Abrir menú" })).toHaveCount(0);
  });
});
