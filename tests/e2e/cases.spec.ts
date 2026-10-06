import { expect, test } from "@playwright/test";

test("case page renders the full narrative", async ({ page }) => {
  await page.goto("/casos/la-terraza/");

  await expect(page).toHaveTitle(/La Terraza/);
  await expect(page.locator("h1")).toContainText("Un catálogo");

  // The four narrative chapters.
  for (const label of ["Contexto", "Problema", "Intervención", "Resultado", "Solución"]) {
    await expect(page.locator("main")).toContainText(label);
  }

  // Fact sheet.
  const facts = page.locator("aside.case__facts");
  await expect(facts).toContainText("Sector");
  await expect(facts).toContainText("Restauración");
  await expect(facts).toContainText("React / Laravel / MySQL / Filament");
  await expect(facts).toContainText("Alcance del caso");
});

test("case gallery renders screenshots with captions", async ({ page }) => {
  await page.goto("/casos/la-terraza/");

  const gallery = page.locator("section.case__gallery");
  await expect(gallery).toHaveAttribute("data-presentation", "editorial");
  await expect(gallery.locator("figure")).toHaveCount(8);
  await expect(gallery.getByText("Consulta del menú por categoría: platillos.")).toBeVisible();
});

test("case gallery keeps the first pair of screenshots in balanced frames", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/casos/la-terraza/");

  const frames = await page.locator("section.case__gallery figure").evaluateAll((elements) =>
    elements.slice(0, 2).map((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );
  expect(frames).toHaveLength(2);
  expect(Math.abs(frames[0]!.width - frames[1]!.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(frames[0]!.height - frames[1]!.height)).toBeLessThanOrEqual(2);
});

test("La Terraza detail stays focused on its software rather than a venue photograph", async ({
  page,
}) => {
  await page.goto("/casos/la-terraza/");
  await expect(page.locator("figure.case__context")).toHaveCount(0);
  await expect(page.locator("section.case__gallery figure")).toHaveCount(8);
});

test("next case pagination works", async ({ page }) => {
  await page.goto("/casos/gestion-medica/");

  const nav = page.getByRole("navigation", { name: "Navegación entre casos" });
  const next = nav.getByRole("link", { name: /Siguiente/ });
  await expect(next).toHaveAttribute("href", "/casos/la-terraza/");
});

for (const width of [320, 390]) {
  test(`mobile case pagination anchors previous left and next right at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/casos/la-terraza/");

    const nav = page.getByRole("navigation", { name: "Navegación entre casos" });
    const previous = nav.getByRole("link", { name: /Anterior/ });
    const next = nav.getByRole("link", { name: /Siguiente/ });
    const [navBox, previousBox, nextBox] = await Promise.all([
      nav.boundingBox(),
      previous.boundingBox(),
      next.boundingBox(),
    ]);
    expect(navBox).not.toBeNull();
    expect(previousBox).not.toBeNull();
    expect(nextBox).not.toBeNull();
    expect(Math.abs(previousBox!.x - navBox!.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(nextBox!.x + nextBox!.width - navBox!.x - navBox!.width)).toBeLessThanOrEqual(
      2,
    );
    expect(nextBox!.y).toBeGreaterThan(previousBox!.y);
  });
}

test("case gallery opens an in-page viewer with navigation and restores focus on close", async ({
  page,
}) => {
  await page.goto("/casos/la-terraza/");

  const gallery = page.locator("section.case__gallery");
  const first = gallery.locator("figure a").first();
  const second = gallery.locator("figure a").nth(1);
  const firstSource = await first.getAttribute("href");
  const secondSource = await second.getAttribute("href");

  await first.click();
  const viewer = page.getByRole("dialog", { name: "Galería del proyecto" });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("img")).toHaveAttribute("src", firstSource!);
  await expect(page).toHaveURL(/\/casos\/la-terraza\/$/);

  await viewer.getByRole("button", { name: "Siguiente imagen" }).click();
  await expect(viewer.locator("img")).toHaveAttribute("src", secondSource!);
  await page.keyboard.press("ArrowLeft");
  await expect(viewer.locator("img")).toHaveAttribute("src", firstSource!);

  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(first).toBeFocused();
});

test("case gallery viewer fits a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/casos/la-terraza/");
  await page.locator("section.case__gallery figure a").first().click();

  const viewer = page.getByRole("dialog", { name: "Galería del proyecto" });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("img")).toBeVisible();
  const box = await viewer.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await viewer.getByRole("button", { name: "Cerrar galería" }).click();
  await expect(viewer).toBeHidden();
});

test("cases without gallery render without an empty section", async ({ page }) => {
  await page.goto("/casos/numeriq/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("tutoría");
  await expect(page.locator("section.case__gallery")).toHaveCount(0);
  // External resource link from the frontmatter.
  await expect(
    page.locator("aside.case__facts").getByRole("link", { name: "Diseño en Figma" }),
  ).toHaveAttribute("href", /^https:\/\/www\.figma\.com/);
});

test("old project URLs redirect to the new case URLs", async ({ page }) => {
  const response = await page.goto("/proyectos/about-laTerraza.html");
  expect(response?.status()).toBe(200);
  // Stub pages carry a meta-refresh that real browsers follow immediately.
  await page.waitForURL(/\/casos\/la-terraza\//, { timeout: 10_000 });
  await expect(page).toHaveTitle(/La Terraza/);
});

test("404 page is reachable and usable", async ({ page }) => {
  const response = await page.goto("/no-existe-esta-pagina/");
  if (response) {
    expect(response.status()).toBe(404);
  }
  await expect(page).toHaveTitle(/no encontrada/i);
  await expect(page.getByRole("link", { name: "Ir al inicio", exact: true })).toBeVisible();
});
