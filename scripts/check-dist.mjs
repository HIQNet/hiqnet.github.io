/**
 * One-shot QA helper: boots `astro preview` against the current `dist` build,
 * probes key routes and reports status codes and markers. Exits with a
 * non-zero code on failure. Not part of the build.
 *
 *   node scripts/check-dist.mjs
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}`;

/** @type {Array<{ label: string; path: string; expectStatus?: number; marker: (body: string) => boolean }>} */
const checks = [
  { label: "GET /", path: "/", marker: (t) => t.includes("<h1") },
  {
    label: "GET / unknown route falls back to 404 page",
    path: "/no-existe-esta-pagina/",
    expectStatus: 404,
    marker: (t) => t.includes("no existe"),
  },
  {
    label: "GET legacy redirect stub",
    path: "/proyectos/about-laTerraza.html",
    marker: (t) => t.includes('http-equiv="refresh"') && t.includes("/casos/la-terraza/"),
  },
  { label: "GET sitemap", path: "/sitemap-0.xml", marker: (t) => t.includes("la-terraza") },
  { label: "GET case page", path: "/casos/la-terraza/", marker: (t) => t.includes("Un catálogo") },
  { label: "GET robots", path: "/robots.txt", marker: (t) => t.includes("sitemap-index.xml") },
  { label: "GET og image", path: "/og.png", marker: () => true },
];

const server = spawn(
  process.execPath,
  ["node_modules/astro/bin/astro.mjs", "preview", "--port", String(PORT), "--host", "127.0.0.1"],
  { stdio: "ignore" },
);

let failed = false;

const cleanup = () => {
  server.kill();
};

process.on("exit", cleanup);

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

  for (const check of checks) {
    try {
      const res = await fetch(`${BASE}${check.path}`);
      const text = await res.text();
      const okStatus = res.status === (check.expectStatus ?? 200);
      const okMark = check.marker(text);
      const ok = okStatus && okMark;
      console.log(`${ok ? "ok  " : "FAIL"} [${res.status}] ${check.label}`);
      if (!okStatus) console.log(`      expected status ${check.expectStatus ?? 200}`);
      if (!okMark) console.log("      marker missing in response body");
      if (!ok) failed = true;
    } catch (error) {
      console.log(`FAIL ${check.label}: ${error instanceof Error ? error.message : String(error)}`);
      failed = true;
    }
  }
} finally {
  cleanup();
}

if (failed) {
  console.log("\ncheck-dist: FAILED");
  process.exitCode = 1;
} else {
  console.log("\ncheck-dist: all checks passed");
}
