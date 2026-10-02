import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const siteUrl = "https://hiqnet.github.io";
const actionTimeout = 10_000;
const storyVariables = ["--connection", "--flow", "--system"];
export const projectRoutes = [
  "/proyectos/about-gestion-medica.html",
  "/proyectos/about-laTerraza.html",
  "/proyectos/about-SWI.html",
  "/proyectos/about-webService.html",
  "/proyectos/about-bienesRaices.html",
];
const routes = ["/", ...projectRoutes];
const projectWidths = [390, 1280];

export function readWidths(value = process.env.HIQNET_QA_WIDTHS ?? "375,390,768,1024,1280,1440") {
  const values = value.split(",").map((part) => Number(part.trim()));
  assert.ok(values.length && values.every((width) => Number.isInteger(width) && width > 0 && width <= 7680),
    "HIQNET_QA_WIDTHS must contain comma-separated integer widths between 1 and 7680");
  return [...new Set(values)];
}

export function readTimeout(value = process.env.HIQNET_QA_TIMEOUT_MS ?? "240000") {
  const timeout = Number(value);
  assert.ok(Number.isSafeInteger(timeout) && timeout > 0 && timeout <= 2_147_483_647,
    "HIQNET_QA_TIMEOUT_MS must be a positive integer <= 2147483647");
  return timeout;
}

async function condition(page, label, predicate, argument) {
  try {
    await page.waitForFunction(predicate, argument, { timeout: actionTimeout, polling: "raf" });
  } catch (error) {
    throw new Error(`${label}: ${error.message}`, { cause: error });
  }
}

async function scrollTo(page, y) {
  await page.evaluate((top) => { window.scrollTo(0, top); }, y);
  // Two frames are enough for IntersectionObserver and scroll handlers to settle,
  // and they survive network or preview hiccups without leaving dangling promises.
  await page.waitForTimeout(60);
}

async function assertOverflow(page) {
  const size = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(Math.max(size.document, size.body) <= size.viewport + 1,
    `horizontal overflow: ${JSON.stringify(size)}`);
}

async function scrollAndLoadImages(page) {
  // Visit the actual page instead of removing loading=lazy or forcing reveal classes.
  let y = 0;
  let reachedBottom = false;
  for (let step = 0; step < 200; step += 1) {
    await scrollTo(page, y);
    await assertOverflow(page);
    const position = await page.evaluate(() => ({
      y: scrollY,
      height: innerHeight,
      bottom: document.documentElement.scrollHeight - innerHeight,
    }));
    if (position.y >= position.bottom - 1) {
      reachedBottom = true;
      break;
    }
    y = Math.min(position.y + position.height * 0.75, position.bottom);
  }
  assert.ok(reachedBottom, "page did not reach its bottom within 200 scroll steps");

  // A horizontal gallery or a late layout shift can keep an image outside the sweep.
  for (const image of await page.locator("img").all()) {
    if (await image.isVisible()) await image.scrollIntoViewIfNeeded();
  }
  await condition(page, "all images must finish loading after scrolling", () =>
    [...document.images].every((image) => image.complete));
  const broken = await page.locator("img").evaluateAll((images) => images
    .filter((image) => image.naturalWidth === 0)
    .map((image) => image.currentSrc || image.getAttribute("src")));
  assert.deepEqual(broken, [], `broken images: ${broken.join(", ")}`);
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((image) => image.decode()));
    await document.fonts.ready;
  });
  await assertOverflow(page);
}

// Offscreen content counts as readable; content hidden by an ancestor does not.
// Comparing to a normal-JS baseline avoids rejecting intentional responsive variants.
async function readableContent(page) {
  return page.evaluate(() => {
    const selector = "main h1, main h2, main h3, main p, main li, main dt, main dd, main figcaption, main img, main a";
    return [...document.querySelectorAll(selector)]
      .filter((element) => !element.closest('[aria-hidden="true"]'))
      .map((element) => {
        const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
        const key = `${element.tagName}:${element.tagName === "IMG" ? element.getAttribute("alt") : text}`;
        let visible = element.getClientRects().length > 0;
        for (let node = element; node && visible; node = node.parentElement) {
          const style = getComputedStyle(node);
          visible = style.display !== "none" && style.visibility === "visible" && Number(style.opacity) >= 0.99;
          if (style.clipPath.startsWith("inset(") && style.clipPath.includes("100%")) visible = false;
        }
        return { key, visible, meaningful: element.tagName === "IMG" || text.length > 0 };
      }).filter((item) => item.meaningful);
  });
}

async function assertRevealsVisible(page, route) {
  const reveals = await page.locator(".reveal").count();
  // Detail pages are intentionally static, so the entrance animation is only required on the home.
  if (route !== "/") {
    assert.equal(reveals, 0, "detail pages must not depend on a .reveal entrance");
    return;
  }
  assert.ok(reveals, "expected .reveal content to exercise reduced motion");
  await condition(page, "all .reveal content must be visible", () =>
    [...document.querySelectorAll(".reveal")].every((element) => {
      if (!element.getClientRects().length) return false;
      for (let node = element; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity) < 0.99) return false;
      }
      return true;
    }));
}

async function menuState(page, open) {
  await condition(page, `mobile disclosure should be ${open ? "open" : "closed"}`, (expected) => {
    const button = document.querySelector("#menu-toggle");
    const menu = document.querySelector("#mobile-menu");
    if (!button || !menu) return false;
    const style = getComputedStyle(menu);
    return menu.hidden === !expected && button.getAttribute("aria-expanded") === String(expected)
      && (!expected || (style.display !== "none" && style.visibility === "visible"));
  }, open);
}

async function assertMenu(page, route, width) {
  const button = page.locator("#menu-toggle");
  const menu = page.locator("#mobile-menu");
  assert.equal(await button.count(), 1);
  assert.equal(await menu.count(), 1);
  assert.equal(await button.getAttribute("aria-controls"), "mobile-menu");
  if (width >= 1024) {
    assert.equal(await button.isVisible(), false, "mobile button visible at desktop breakpoint");
    await menuState(page, false);
    return;
  }

  await scrollTo(page, 0);
  await menuState(page, false);
  await button.click();
  await menuState(page, true);
  assert.notEqual(await menu.getAttribute("aria-modal"), "true", "navbar is a nonmodal disclosure");
  const items = menu.locator('a[href]:visible, button:visible:not([disabled]), [tabindex="0"]:visible');
  assert.ok(await items.count(), "mobile menu has no keyboard targets");
  const first = items.first();
  const last = items.last();

  await button.focus();
  await page.keyboard.press("Tab");
  assert.ok(await first.evaluate((node) => document.activeElement === node), "Tab must enter the first menu item");
  await button.focus();
  await page.keyboard.press("Shift+Tab");
  assert.ok(await last.evaluate((node) => document.activeElement === node), "Shift+Tab must wrap to the last menu item");
  await last.focus();
  await page.keyboard.press("Tab");
  assert.ok(await button.evaluate((node) => document.activeElement === node), "Tab must wrap to the menu button");
  await first.focus();
  await page.keyboard.press("Shift+Tab");
  assert.ok(await button.evaluate((node) => document.activeElement === node), "Shift+Tab must return to the menu button");
  await last.focus();
  await page.keyboard.press("Escape");
  await menuState(page, false);
  assert.ok(await button.evaluate((node) => document.activeElement === node), "Escape must restore button focus");

  await button.click();
  await menuState(page, true);
  // Use a real pointer event outside the disclosure, without guessing header height.
  const outside = await page.evaluate(() => {
    const menu = document.querySelector("#mobile-menu");
    const button = document.querySelector("#menu-toggle");
    for (let y = innerHeight - 12; y > 0; y -= 24) {
      for (const x of [12, innerWidth / 2, innerWidth - 12]) {
        const node = document.elementFromPoint(x, y);
        if (node && !menu.contains(node) && !button.contains(node)
          && !node.closest("a, button, input, select, textarea")) return { x, y };
      }
    }
    return null;
  });
  assert.ok(outside, "no pointer target outside the nonmodal menu");
  await page.mouse.click(outside.x, outside.y);
  await menuState(page, false);

  await button.click();
  await menuState(page, true);
  const localLink = menu.locator('a[href^="#"], a[href^="/index.html#"], a[href^="/#"]').first();
  assert.equal(await localLink.count(), 1, "expected a local navigation link in mobile menu");
  await localLink.click();
  await page.waitForLoadState("load");
  await menuState(page, false);
  // Project links navigate back home: return to the case under test before resize.
  if (new URL(page.url()).pathname !== route) await navigate(page, route);
  await scrollTo(page, 0);
  await button.click();
  await menuState(page, true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await menuState(page, false);
  await page.setViewportSize({ width, height: 900 });
  await menuState(page, false);
  await assertOverflow(page);
}

async function storySnapshot(page) {
  return page.locator("[data-story-visual]").evaluate((element, names) => {
    const style = getComputedStyle(element);
    return names.map((name) => style.getPropertyValue(name).trim());
  }, storyVariables);
}

async function assertStoryNotSticky(page) {
  await condition(page, "story must not be sticky/fixed on mobile or with reduced motion", () => {
    const visual = document.querySelector("[data-story-visual]");
    if (!visual) return false;
    for (let node = visual; node; node = node.parentElement) {
      if (["sticky", "fixed"].includes(getComputedStyle(node).position)) return false;
      if (node.matches("[data-story-section]")) break;
    }
    return true;
  });
}

async function exerciseStory(page, width, reduced, screenshot) {
  assert.equal(await page.locator("[data-story-section]").count(), 1);
  assert.equal(await page.locator("[data-story-visual]").count(), 1);
  const steps = page.locator("[data-story-step]");
  assert.equal(await steps.count(), 4, "story must retain its four narrative steps");
  const active = width >= 1024 && !reduced;
  if (!active) await assertStoryNotSticky(page);
  const bounds = await page.locator("[data-story-section]").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { start: scrollY + rect.top - innerHeight, end: scrollY + rect.bottom };
  });
  await scrollTo(page, Math.max(0, bounds.start));
  const samples = [await storySnapshot(page)];
  for (let index = 0; index < 4; index += 1) {
    const y = await steps.nth(index).evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return scrollY + rect.top + rect.height / 2 - innerHeight / 2;
    });
    await scrollTo(page, y);
    if (active) {
      await condition(page, "desktop story variables must be numeric progress values", (names) => {
        const style = getComputedStyle(document.querySelector("[data-story-visual]"));
        return names.every((name) => {
          const value = style.getPropertyValue(name).trim();
          return value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1;
        });
      }, storyVariables);
    }
    samples.push(await storySnapshot(page));
    await assertOverflow(page);
    if (screenshot) await screenshot(`story-${width}-state-${index + 1}`, false);
  }
  await scrollTo(page, bounds.end);
  samples.push(await storySnapshot(page));
  if (active) {
    storyVariables.forEach((name, index) => {
      const values = samples.map((sample) => Number(sample[index]));
      assert.ok(samples.every((sample) => sample[index] !== "") && values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1),
        `${name} must remain a numeric 0–1 progress value`);
      assert.ok(Math.max(...values) - Math.min(...values) > 0.01,
        `${name} must progress through desktop story steps: ${values.join(", ")}`);
      assert.ok(values.at(-1) >= values[0], `${name} must advance, not reverse`);
    });
  } else {
    assert.ok(samples.every((sample) => JSON.stringify(sample) === JSON.stringify(samples[0])),
      `story scroll progress must be inactive on mobile/reduced motion: ${JSON.stringify(samples)}`);
  }
}

async function navigate(page, route) {
  const response = await page.goto(new URL(route, page.__qaBaseUrl).href, { waitUntil: "load" });
  assert.equal(response?.status(), 200, `HTTP ${response?.status()} on ${route}`);
  assert.equal(new URL(page.url()).origin, new URL(page.__qaBaseUrl).origin, "navigation escaped the preview origin");
}

async function seoAndLinks(page, route, titles, localLinks, imageUrls) {
  const data = await page.evaluate(() => {
    const meta = (selector) => [...document.querySelectorAll(selector)].map((node) => node.getAttribute("content"));
    return {
      lang: document.documentElement.lang,
      titles: [...document.querySelectorAll("title")].map((node) => node.textContent.trim()),
      description: meta('meta[name="description"]'),
      canonical: [...document.querySelectorAll('link[rel="canonical"]')].map((node) => node.getAttribute("href")),
      robots: meta('meta[name="robots"]'),
      h1s: document.querySelectorAll("h1").length,
      og: Object.fromEntries(["title", "description", "url", "image", "type", "site_name", "locale"]
        .map((name) => [name, meta(`meta[property="og:${name}"]`)])),
      twitter: Object.fromEntries(["card", "title", "description", "image"]
        .map((name) => [name, meta(`meta[name="twitter:${name}"]`)])),
      schema: [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) => JSON.parse(node.textContent)),
      links: [...document.querySelectorAll("a[href]")].map((node) => node.href),
    };
  });
  const one = (values, field) => {
    assert.equal(values.length, 1, `${route}: expected exactly one ${field}`);
    assert.ok(values[0]?.trim(), `${route}: empty ${field}`);
    return values[0];
  };
  assert.equal(data.lang, "es");
  assert.equal(data.h1s, 1, `${route}: expected one h1`);
  const title = one(data.titles, "title");
  const description = one(data.description, "description");
  for (const [otherRoute, otherTitle] of titles) {
    assert.ok(otherRoute === route || otherTitle !== title, `duplicate title on ${route} and ${otherRoute}`);
  }
  titles.set(route, title);
  const canonical = `${siteUrl}${route}`;
  assert.equal(one(data.canonical, "canonical"), canonical);
  assert.ok(data.robots.every((value) => !/\b(noindex|none)\b/i.test(value ?? "")), `${route}: noindex robots directive`);
  assert.equal(one(data.og.title, "og:title"), title);
  assert.equal(one(data.og.description, "og:description"), description);
  assert.equal(one(data.og.url, "og:url"), canonical);
  for (const name of ["type", "site_name", "locale"]) one(data.og[name], `og:${name}`);
  const image = one(data.og.image, "og:image");
  assert.equal(new URL(image).protocol, "https:");
  assert.equal(new URL(image).origin, siteUrl, "social image should remain a local site asset");
  imageUrls.add(new URL(image).pathname);
  assert.equal(one(data.twitter.card, "twitter:card"), "summary_large_image");
  assert.equal(one(data.twitter.title, "twitter:title"), title);
  assert.equal(one(data.twitter.description, "twitter:description"), description);
  assert.equal(one(data.twitter.image, "twitter:image"), image);
  assert.ok(data.schema.length, `${route}: missing JSON-LD`);
  const entities = data.schema.flatMap((value) => Array.isArray(value) ? value : value["@graph"] ?? [value]);
  assert.ok(data.schema.every((value) => Array.isArray(value)
    ? value.every((node) => node["@context"] === "https://schema.org")
    : value["@context"] === "https://schema.org"), "JSON-LD must use schema.org context");
  assert.ok(entities.some((entity) => {
    const types = [].concat(entity["@type"] ?? []);
    return types.some((type) => ["ProfessionalService", "Organization"].includes(type))
      && entity.name && new URL(entity.url).href === `${siteUrl}/`;
  }), "JSON-LD must retain the business identity and production URL");
  for (const href of data.links) {
    const url = new URL(href);
    if ([new URL(page.__qaBaseUrl).origin, siteUrl].includes(url.origin)) {
      localLinks.add(`${url.pathname}${url.search}${url.hash}`);
    }
  }
}

async function assertProjectNavigation(page, route) {
  const index = projectRoutes.indexOf(route);
  const links = await page.getByRole("navigation", { name: "Navegación entre proyectos" })
    .locator("a").evaluateAll((nodes) => nodes.map((node) => ({
      path: new URL(node.href).pathname,
      name: (node.getAttribute("aria-label") || node.textContent).trim(),
    })));
  assert.deepEqual(links.map((link) => link.path), [projectRoutes[index - 1], projectRoutes[index + 1]].filter(Boolean));
  assert.ok(links.every((link) => link.name.length > 0), "project navigation needs accessible names");
}

async function checkSiteFiles(context, page, baseUrl, localLinks, imageUrls) {
  const get = async (path) => {
    const response = await context.request.get(new URL(path, baseUrl).href, { timeout: actionTimeout });
    assert.equal(response.status(), 200, `HTTP ${response.status()} for ${path}`);
    assert.equal(new URL(response.url()).origin, new URL(baseUrl).origin, `local URL redirected offsite: ${path}`);
    return response;
  };
  const sitemapResponse = await get("/sitemap.xml");
  const sitemap = await page.evaluate((xml) => {
    const document = new DOMParser().parseFromString(xml, "application/xml");
    if (document.querySelector("parsererror")) throw new Error("invalid sitemap XML");
    return [...document.getElementsByTagNameNS("http://www.sitemaps.org/schemas/sitemap/0.9", "loc")]
      .map((node) => node.textContent.trim());
  }, await sitemapResponse.text());
  assert.deepEqual(sitemap.toSorted(), routes.map((route) => siteUrl + route).toSorted(), "sitemap must match the six canonical routes exactly");
  const robots = await (await get("/robots.txt")).text();
  assert.match(robots, /^Sitemap:\s*https:\/\/hiqnet\.github\.io\/sitemap\.xml\s*$/im);
  const groups = [];
  let group = { agents: [], rules: [] };
  for (const line of robots.split(/\r?\n/)) {
    const [rawDirective, ...parts] = line.replace(/#.*/, "").split(":");
    const directive = rawDirective.trim().toLowerCase();
    const value = parts.join(":").trim();
    if (directive === "user-agent") {
      if (group.rules.length) {
        groups.push(group);
        group = { agents: [], rules: [] };
      }
      group.agents.push(value);
    } else if (["allow", "disallow"].includes(directive)) {
      group.rules.push({ allow: directive === "allow", pattern: value });
    }
  }
  groups.push(group);
  const wildcardGroups = groups.filter((entry) => entry.agents.includes("*"));
  assert.ok(wildcardGroups.length, "robots.txt must declare User-agent: *");
  for (const route of routes) {
    const matching = wildcardGroups.flatMap((entry) => entry.rules).filter(({ pattern }) => {
      if (!pattern) return false;
      const anchored = pattern.endsWith("$");
      const prefix = anchored ? pattern.slice(0, -1) : pattern;
      const expression = prefix.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
      return new RegExp(`^${expression}${anchored ? "$" : ""}`).test(route);
    }).sort((a, b) => b.pattern.length - a.pattern.length || Number(b.allow) - Number(a.allow));
    assert.ok(!matching.length || matching[0].allow, `robots.txt blocks canonical route: ${route}`);
  }

  const documents = new Map();
  for (const href of localLinks) {
    const url = new URL(href, baseUrl);
    const key = `${url.pathname}${url.search}`;
    if (!documents.has(key)) {
      const response = await get(key);
      documents.set(key, { html: await response.text(), type: response.headers()["content-type"] ?? "" });
      await response.dispose();
    }
    if (url.hash) {
      const target = decodeURIComponent(url.hash.slice(1));
      const document = documents.get(key);
      assert.match(document.type, /text\/html/i, `fragment points to non-HTML resource: ${href}`);
      const found = await page.evaluate(({ html, target }) => {
        const document = new DOMParser().parseFromString(html, "text/html");
        return Boolean(document.getElementById(target)
          || [...document.querySelectorAll("a[name]")].some((node) => node.getAttribute("name") === target)
          || target.toLowerCase() === "top");
      }, { html: document.html, target });
      assert.ok(found, `missing local fragment: ${href}`);
    }
  }
  for (const url of imageUrls) {
    const response = await get(url);
    assert.match(response.headers()["content-type"] ?? "", /^image\//, `invalid social image MIME: ${url}`);
    await response.dispose();
  }
}

export async function runSmoke({ baseUrl = process.env.HIQNET_BASE_URL ?? "http://127.0.0.1:4321", signal } = {}) {
  const origin = new URL(baseUrl);
  assert.ok(["http:", "https:"].includes(origin.protocol) && origin.pathname === "/" && !origin.search && !origin.hash,
    "HIQNET_BASE_URL must be an HTTP(S) origin without path, query or fragment");
  const widths = readWidths();
  const screenshots = process.env.HIQNET_QA_SCREENSHOTS === "1";
  const screenshotDirectory = resolve(root, ".superpowers/qa-rebuild");
  if (screenshots) await mkdir(screenshotDirectory, { recursive: true });
  signal?.throwIfAborted();
  const browser = await chromium.launch({ headless: true, timeout: actionTimeout });
  const abort = () => { void browser.close().catch(() => {}); };
  signal?.addEventListener("abort", abort, { once: true });
  const titles = new Map();
  const localLinks = new Set(routes);
  const imageUrls = new Set();
  const baselines = new Map();
  let passed = 0;

  const withPage = async (label, route, width, options, test) => {
    signal?.throwIfAborted();
    console.log(`QA: ${label} ${route} @ ${width}px`);
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: options.reducedMotion ?? "no-preference",
      javaScriptEnabled: options.javaScriptEnabled ?? true,
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    page.__qaBaseUrl = baseUrl;
    page.setDefaultTimeout(actionTimeout);
    page.setDefaultNavigationTimeout(actionTimeout);
    const errors = [];
    const deliberatelyBlocked = new Set();
    const resourceChecks = [];
    if (options.blockBundles) {
      await page.route("**/*", async (requestRoute) => {
        const request = requestRoute.request();
        if (request.resourceType() === "script" && new URL(request.url()).origin === origin.origin) {
          deliberatelyBlocked.add(request.url());
          await requestRoute.abort("failed");
        } else await requestRoute.continue();
      });
    }
    page.on("console", (message) => {
      // Chromium can omit a URL on its synthetic failed-resource console message.
      // Unrelated failures still surface through requestfailed/response/pageerror.
      const expectedFailure = options.blockBundles && deliberatelyBlocked.size > 0
        && (!message.location().url || deliberatelyBlocked.has(message.location().url))
        && message.type() === "error" && /^Failed to load resource: net::ERR_FAILED$/.test(message.text());
      if (["warning", "error"].includes(message.type()) && !expectedFailure) {
        errors.push(`${message.type()}: ${message.text()} (${message.location().url})`);
      }
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("requestfailed", (request) => {
      if (!deliberatelyBlocked.has(request.url())) errors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText})`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
      if (["script", "stylesheet", "font", "image"].includes(response.request().resourceType())) {
        resourceChecks.push(response.finished().then((failure) => {
          if (failure) errors.push(`incomplete resource: ${response.url()} (${failure.message})`);
        }).catch((error) => errors.push(`resource: ${response.url()} (${error.message})`)));
      }
    });
    const capture = screenshots ? async (name, fullPage = true) => {
      await page.screenshot({ path: resolve(screenshotDirectory, `${name}.png`), fullPage, animations: "disabled" });
    } : null;
    try {
      await navigate(page, route);
      await test({ page, context, capture });
      if (options.blockBundles) assert.ok(deliberatelyBlocked.size, "no local JS bundle was intercepted; fallback test would be vacuous");
      await Promise.all(resourceChecks);
      assert.deepEqual(errors, [], `browser/resource errors:\n${errors.join("\n")}`);
      passed += 1;
    } catch (error) {
      if (capture && !page.isClosed() && !signal?.aborted) {
        const name = `${label}-${route}-${width}`.replace(/[^a-zA-Z0-9_-]/g, "-");
        await page.screenshot({ path: resolve(screenshotDirectory, `failure-${name}.png`), timeout: 3000 }).catch(() => {});
      }
      throw new Error(`[${label} ${route} @ ${width}px] ${error.message}${errors.length ? `\nResources: ${errors.join("\n")}` : ""}`, { cause: error });
    } finally {
      await context.close();
    }
  };

  const regularCase = async (route, width, baselineOnly = false) => {
    await withPage(baselineOnly ? "fallback-baseline" : "responsive", route, width, {}, async ({ page, capture }) => {
      await assertOverflow(page);
      await seoAndLinks(page, route, titles, localLinks, imageUrls);
      await scrollAndLoadImages(page);
      await assertRevealsVisible(page, route);
      baselines.set(`${route}:${width}`, (await readableContent(page)).filter((item) => item.visible).map((item) => item.key));
      if (baselineOnly) return;
      if (route === "/") await exerciseStory(page, width, false, capture);
      else await assertProjectNavigation(page, route);
      await scrollTo(page, 0);
      if (capture) {
        const name = route === "/" ? "home" : route.split("/").at(-1).replace(/\.html$/, "");
        await page.locator("main section").first().screenshot({
          path: resolve(screenshotDirectory, `${name}-${width}-hero.png`), animations: "disabled",
        });
        await capture(`${name}-${width}-fullpage`);
      }
      await assertMenu(page, route, width);
    });
  };

  try {
    signal?.throwIfAborted();
    for (const width of widths) await regularCase("/", width);
    for (const route of projectRoutes) {
      for (const width of projectWidths) await regularCase(route, width);
    }
    // Overrides change the responsive sweep, not the mandatory mobile/desktop fallback coverage.
    for (const width of projectWidths) {
      if (!baselines.has(`/:${width}`)) await regularCase("/", width, true);
    }

    await withPage("links-and-crawlability", "/", 1280, {}, async ({ page, context }) => {
      await checkSiteFiles(context, page, baseUrl, localLinks, imageUrls);
    });

    for (const route of routes) {
      for (const width of projectWidths) {
        for (const mode of ["no-js", "blocked-bundle"]) {
          await withPage(mode, route, width, {
            javaScriptEnabled: mode !== "no-js",
            blockBundles: mode === "blocked-bundle",
          }, async ({ page }) => {
            await scrollAndLoadImages(page);
            const baseline = baselines.get(`${route}:${width}`);
            assert.ok(baseline?.length, "missing readable-content baseline");
            // Poll actual styles: finite CSS entrance animations may still be completing.
            const deadline = Date.now() + actionTimeout;
            let missing;
            do {
              const visible = (await readableContent(page)).filter((item) => item.visible).map((item) => item.key);
              const remaining = [...visible];
              missing = baseline.filter((key) => {
                const index = remaining.indexOf(key);
                if (index < 0) return true;
                remaining.splice(index, 1);
                return false;
              });
              if (!missing.length) break;
              await page.waitForTimeout(60);
            } while (Date.now() < deadline);
            assert.deepEqual(missing, [], `content disappeared in ${mode}: ${missing.slice(0, 8).join("; ")}`);
            assert.equal(await page.locator("main h1").count(), 1);
          });
        }

        await withPage("reduced-motion-and-runtime-toggle", route, width, { reducedMotion: "reduce" }, async ({ page }) => {
          // Check before scrolling: reduced motion must not depend on IntersectionObserver.
          await assertRevealsVisible(page, route);
          if (route === "/") await exerciseStory(page, width, true);
          await page.emulateMedia({ reducedMotion: "no-preference" });
          if (route === "/") await exerciseStory(page, width, false);
          await page.emulateMedia({ reducedMotion: "reduce" });
          await assertRevealsVisible(page, route);
          if (route === "/") await exerciseStory(page, width, true);
          await scrollAndLoadImages(page);
        });
      }
    }
    console.log(`HiQNet smoke passed: ${passed} cases; home widths ${widths.join(", ")}; five projects at 390/1280; SEO, links, fallbacks and motion`);
    if (screenshots) console.log(`Screenshots: ${screenshotDirectory}`);
  } finally {
    signal?.removeEventListener("abort", abort);
    await browser.close();
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (process.argv.includes("--help")) {
    console.log("Usage: node scripts/qa/hiqnet-smoke.mjs\nRequires an existing supervised preview. Prefer node scripts/qa/run.mjs.\nEnvironment: HIQNET_BASE_URL, HIQNET_QA_WIDTHS, HIQNET_QA_TIMEOUT_MS (240000), HIQNET_QA_SCREENSHOTS=1");
  } else {
    const controller = new AbortController();
    let forcedExit;
    const cancel = (reason) => {
      if (controller.signal.aborted) return;
      controller.abort(new Error(reason));
      forcedExit = setTimeout(() => process.exit(process.exitCode || 124), 10_000);
    };
    const interrupt = () => { process.exitCode = 130; cancel("QA interrupted"); };
    const terminate = () => { process.exitCode = 143; cancel("QA terminated"); };
    const deadline = setTimeout(() => { process.exitCode = 124; cancel("QA deadline exceeded"); }, readTimeout());
    process.once("SIGINT", interrupt);
    process.once("SIGTERM", terminate);
    try {
      await runSmoke({ signal: controller.signal });
    } catch (error) {
      console.error(controller.signal.reason ?? error);
      process.exitCode ||= 1;
    } finally {
      clearTimeout(deadline);
      clearTimeout(forcedExit);
      process.removeListener("SIGINT", interrupt);
      process.removeListener("SIGTERM", terminate);
    }
  }
}
