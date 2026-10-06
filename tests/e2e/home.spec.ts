import { expect, test } from "@playwright/test";

test("home page loads with expected metadata and hero", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/HiQNet/);
  await expect(page.locator("h1")).toContainText("Software que hace más claro el trabajo");
  await expect(page.locator("main")).toContainText("Plataformas web");

  // All narrative sections exist.
  for (const id of ["enfoque", "servicios", "casos", "contacto"]) {
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  }
});

test("hero keeps its primary action and project evidence in the first viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator("section#inicio .hero__proof img")).toBeVisible();
  await expect(page.locator("section#inicio .hero__actions")).toBeInViewport();
});

test("navbar exposes the main anchors", async ({ page }) => {
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Navegación principal" });
  await expect(nav.getByRole("link", { name: "Qué hacemos" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Cómo trabajamos" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Casos" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Contacto" })).toBeVisible();
});

for (const width of [320, 390, 768, 1440]) {
  test(`navbar brand remains legible without colliding with actions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const logo = page.locator(".header__logo");
    await logo.evaluate((image: HTMLImageElement) => image.decode());
    const logoBox = await logo.boundingBox();
    const actionsBox = await page.locator(".header__actions").boundingBox();
    expect(logoBox).not.toBeNull();
    expect(actionsBox).not.toBeNull();
    expect(logoBox!.height).toBeGreaterThanOrEqual(32);
    expect(logoBox!.width / logoBox!.height).toBeGreaterThan(2.9);
    expect(logoBox!.width / logoBox!.height).toBeLessThan(3.1);
    expect(logoBox!.x + logoBox!.width).toBeLessThan(actionsBox!.x);
  });
}

for (const width of [320, 390, 768]) {
  test(`mobile navbar leaves room for the logo at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    await expect(page.locator(".header__cta")).toBeHidden();
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
  });
}

test("navigation links scroll to their sections", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("link", { name: "Casos" })
    .click();

  await expect(page.locator("section#casos")).toBeInViewport();
});

test("primary contact actions carry real outbound links", async ({ page }) => {
  await page.goto("/");

  const whatsapp = page
    .locator("section#contacto")
    .getByRole("link", { name: /Conversar por WhatsApp/ });
  await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/523325689263/);
  await expect(whatsapp).toHaveAttribute("target", "_blank");

  const email = page
    .locator("section#contacto")
    .getByRole("link", { name: "hiqnet.web@gmail.com" });
  await expect(email).toHaveAttribute("href", /^mailto:hiqnet\.web@gmail\.com/);
});

test("featured cases link to their case pages", async ({ page }) => {
  await page.goto("/");

  const feature = page.locator("section#casos").locator("article.work__item");
  await expect(feature).toHaveCount(2);

  const first = feature.first().getByRole("link", { name: "Ver caso completo" });
  await expect(first).toHaveAttribute("href", /^\/casos\//);
});

test("service packages use software symbols instead of staged photography", async ({ page }) => {
  await page.goto("/");

  const packages = page.locator("section#servicios li.services__item");
  await expect(packages).toHaveCount(3);
  for (const item of await packages.all()) {
    await expect(item.locator(".services__media svg")).toHaveCount(1);
    await expect(item.locator(".services__media img")).toHaveCount(0);
  }
});

test("cases have an unmistakable section heading and aligned feature actions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const heading = page.locator("section#casos h2");
  await expect(heading).toHaveText("Casos reales");
  const fontSize = await heading.evaluate((element) =>
    parseFloat(getComputedStyle(element).fontSize),
  );
  expect(fontSize).toBeGreaterThanOrEqual(32);

  const links = page.locator("section#casos article.work__item .work__link");
  const positions = await links.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().top),
  );
  expect(Math.abs(positions[0]! - positions[1]!)).toBeLessThanOrEqual(4);
});

test("all remaining cases are reachable from the cases menu", async ({ page }) => {
  await page.goto("/");

  await page.locator("section#casos details summary").click();
  const allCases = page.getByRole("navigation", { name: "Todos los casos" });
  await expect(allCases.getByRole("link", { name: "Gestión Médica" })).toBeVisible();
  await expect(allCases.getByRole("link", { name: "NumerIQ" })).toBeVisible();
  await expect(allCases.getByRole("link", { name: "Bienes Raíces" })).toBeVisible();
});

test("footer carries contact and social links", async ({ page }) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("navigation", { name: "Navegación del pie de página" }),
  ).toBeVisible();
  await expect(footer.getByRole("link", { name: "Casos" })).toHaveAttribute("href", "#casos");
});
