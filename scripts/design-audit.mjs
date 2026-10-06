/**
 * Design audit harness. Boots `astro preview` against `dist` and inspects the
 * rendered site quantitatively: overflow per viewport, typography per section,
 * reveal-hiding, resource weights, Core Web Vitals and axe accessibility.
 *
 *   node scripts/design-audit.mjs [before|after]
 *
 * Screenshots + raw report are written under `docs/design-qa/`.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}`;
const STAGE = process.argv[2] ?? "before";

const VIEWPORTS = [
  { width: 390, height: 844, label: "390" },
  { width: 430, height: 932, label: "430" },
  { width: 768, height: 1024, label: "768" },
  { width: 1024, height: 768, label: "1024" },
  { width: 1280, height: 800, label: "1280" },
  { width: 1440, height: 900, label: "1440" },
  { width: 1920, height: 1080, label: "1920" },
];

const HOME_SECTIONS = ["inicio", "enfoque", "servicios", "casos", "contacto"];

const OUT_DIR = `docs/design-qa/${STAGE}`;
const report = {
  stage: STAGE,
  generatedAt: new Date().toISOString(),
  viewports: [],
  home: {},
  case: {},
};

async function prepareImagesForCapture(page) {
  // Full-page screenshots do not scroll through lazy media in all browser versions.
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    for (const image of images) image.loading = "eager";
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    window.scrollTo(0, 0);
  });
}

const server = spawn(
  process.execPath,
  ["node_modules/astro/bin/astro.mjs", "preview", "--port", String(PORT), "--host", "127.0.0.1"],
  { stdio: "ignore" },
);

try {
  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) {
    try {
      const res = await fetch(`${BASE}/`);
      ready = res.ok;
    } catch {
      await sleep(250);
    }
  }
  if (!ready) throw new Error("preview server did not become ready");

  const browser = await chromium.launch();
  const context = await browser.newContext({ colorScheme: "dark", serviceWorkers: "block" });

  for (const viewport of VIEWPORTS) {
    const page = await context.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForTimeout(600);

    const view = await page.evaluate(
      ({ sectionIds }) => {
        const doc = document.documentElement;
        const sections = sectionIds
          .map((id) => {
            const el = document.getElementById(id);
            if (!el) return { id, missing: true };
            const rect = el.getBoundingClientRect();
            const h2 = el.querySelector("h1, h2");
            const h3 = el.querySelector("h3");
            const cs2 = h2 ? getComputedStyle(h2) : null;
            const cs3 = h3 ? getComputedStyle(h3) : null;
            return {
              id,
              top: Math.round(rect.top),
              height: Math.round(rect.height),
              h2: cs2
                ? {
                    text: h2.textContent.trim().slice(0, 60),
                    size: cs2.fontSize,
                    weight: cs2.fontWeight,
                    family: cs2.fontFamily.split(",")[0],
                  }
                : null,
              h3: cs3
                ? {
                    text: h3.textContent.trim().slice(0, 40),
                    size: cs3.fontSize,
                    weight: cs3.fontWeight,
                  }
                : null,
            };
          })
          .filter((s) => !s.missing);

        const hiddenReveals = Array.from(document.querySelectorAll("[data-reveal]")).filter(
          (el) => getComputedStyle(el).opacity === "0",
        ).length;
        const totalReveals = document.querySelectorAll("[data-reveal]").length;

        const lazyImages = Array.from(document.images).filter((img) => img.loading === "lazy");
        const unloadedLazy = lazyImages.filter((img) => (img.naturalWidth ?? 0) === 0).length;

        return {
          innerWidth: window.innerWidth,
          scrollWidth: doc.scrollWidth,
          overflow: doc.scrollWidth > window.innerWidth + 1,
          scrollHeight: doc.scrollHeight,
          sections,
          reveals: { total: totalReveals, hiddenAtTop: hiddenReveals },
          lazyImages: lazyImages.length,
          unloadedLazy,
        };
      },
      { sectionIds: HOME_SECTIONS },
    );

    await prepareImagesForCapture(page);
    await page.screenshot({ path: `${OUT_DIR}/home-${viewport.label}.png`, fullPage: true });
    report.viewports.push({ ...viewport, ...view });
    await page.close();
  }

  // Performance + axe pass on the home page @1440 and @390.
  const perfPage = await context.newPage();
  await perfPage.setViewportSize({ width: 1440, height: 900 });
  await perfPage.addInitScript(() => {
    window.__perf = {};
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "largest-contentful-paint")
          window.__perf.lcp = Math.round(entry.startTime);
        if (entry.entryType === "layout-shift")
          window.__perf.cls = (window.__perf.cls ?? 0) + entry.value;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "layout-shift")
          window.__perf.cls = (window.__perf.cls ?? 0) + entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await perfPage.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await perfPage.waitForTimeout(800);

  const metrics = await perfPage.evaluate(() => {
    const resources = performance.getEntriesByType("resource");
    const sizes = {};
    const byExt = (ext) =>
      resources
        .filter((r) => r.name.toLowerCase().endsWith(ext))
        .reduce((a, r) => a + Math.max(0, r.transferSize), 0);
    sizes.js = byExt(".js");
    sizes.css = byExt(".css");
    sizes.font = byExt(".woff2");
    sizes.image = byExt(".png") + byExt(".webp") + byExt(".avif");

    const above = Array.from(document.images).filter(
      (img) => img.getBoundingClientRect().top < window.innerHeight && img.naturalWidth > 0,
    );
    const nav = performance.getEntriesByType("navigation")[0];

    const headings = Array.from(document.querySelectorAll("h1, h2, h3")).map((h) => ({
      level: h.tagName,
      text: h.textContent.replace(/\s+/g, " ").trim(),
    }));

    return {
      ttfb: nav ? Math.round(nav.responseStart) : null,
      fcp: performance.getEntriesByName("first-contentful-paint")[0]
        ? Math.round(performance.getEntriesByName("first-contentful-paint")[0].startTime)
        : null,
      lcp: window.__perf.lcp ?? null,
      cls: window.__perf.cls ?? null,
      sizes,
      aboveFoldImages: above.length,
      headings,
    };
  });

  report.home.metrics = metrics;

  const violations = await new AxeBuilder({ page: perfPage }).analyze();
  report.home.axe = violations.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.length,
    target: v.nodes[0]?.target[0] ?? null,
  }));
  await perfPage.close();

  // Mobile metrics + axe.
  const perfMobile = await context.newPage();
  await perfMobile.setViewportSize({ width: 390, height: 844 });
  await perfMobile.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const mobile = await perfMobile.evaluate(() => {
    const hero = document.getElementById("inicio");
    const heroRect = hero?.getBoundingClientRect();
    const h1 = document.querySelector("h1");
    const h1Rect = h1?.getBoundingClientRect();
    const cta = document.querySelector(".hero__actions");
    const ctaRect = cta?.getBoundingClientRect();
    return {
      heroHeight: heroRect ? Math.round(heroRect.height) : null,
      h1Bottom: h1Rect ? Math.round(h1Rect.bottom) : null,
      ctaTop: ctaRect ? Math.round(ctaRect.top) : null,
      ctaVisibleAboveFold: ctaRect ? ctaRect.top < window.innerHeight : null,
    };
  });
  report.home.mobile = mobile;
  const axeMobile = await new AxeBuilder({ page: perfMobile }).analyze();
  report.home.axeMobile = axeMobile.violations.length;
  await perfMobile.close();

  // Case page pass.
  const casePage = await context.newPage();
  await casePage.setViewportSize({ width: 1440, height: 900 });
  await casePage.goto(`${BASE}/casos/la-terraza/`, { waitUntil: "load" });
  await casePage.waitForTimeout(500);
  await prepareImagesForCapture(casePage);
  await casePage.screenshot({ path: `${OUT_DIR}/case-1440.png`, fullPage: true });
  const axeCase = await new AxeBuilder({ page: casePage }).analyze();
  report.case.axe = axeCase.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.length,
  }));
  await casePage.close();

  const caseMobile = await context.newPage();
  await caseMobile.setViewportSize({ width: 390, height: 844 });
  await caseMobile.goto(`${BASE}/casos/la-terraza/`, { waitUntil: "load" });
  await caseMobile.waitForTimeout(500);
  await prepareImagesForCapture(caseMobile);
  await caseMobile.screenshot({ path: `${OUT_DIR}/case-390.png`, fullPage: true });
  await caseMobile.close();

  await context.close();
  await browser.close();

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(`${OUT_DIR}/raw.json`, JSON.stringify(report, null, 2));

  // Compact console report.
  for (const view of report.viewports) {
    console.log(
      `${view.label.padStart(4)}px overflow=${view.overflow ? "YES" : "no"} height=${view.scrollHeight} reveals=${view.reveals.total}/${view.reveals.hiddenAtTop} hidden lazy=${view.unloadedLazy}/${view.lazyImages}`,
    );
  }
  console.log(
    `home 1440: ttfb=${metrics.ttfb} fcp=${metrics.fcp} lcp=${metrics.lcp} cls=${metrics.cls?.toFixed(3)} js=${metrics.sizes.js}B css=${metrics.sizes.css}B font=${metrics.sizes.font}B image=${metrics.sizes.image}B aboveFold=${metrics.aboveFoldImages}`,
  );
  console.log(
    `axe home: ${report.home.axe.length} violations; mobile hero h1Bottom=${report.home.mobile?.h1Bottom} ctaVisibleFold=${report.home.mobile?.ctaVisibleAboveFold}`,
  );
  console.log(`axe case: ${report.case.axe.length} violations`);
  console.log(`report: ${OUT_DIR}/raw.json`);
} finally {
  server.kill();
}
