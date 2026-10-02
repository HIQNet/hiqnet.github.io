import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { projectRoutes, readTimeout, readWidths, runSmoke } from "./hiqnet-smoke.mjs";

const rootUrl = new URL("../../", import.meta.url);
const root = fileURLToPath(rootUrl);

async function newestInput(path) {
  const info = await stat(path);
  if (!info.isDirectory()) return { path, time: info.mtimeMs };
  const children = await readdir(path);
  const entries = await Promise.all(children.map((child) => newestInput(join(path, child))));
  return entries.reduce((latest, entry) => entry.time > latest.time ? entry : latest, { path, time: 0 });
}

async function assertFreshBuild() {
  const htmlFiles = ["index.html", ...projectRoutes.map((route) => route.slice(1))];
  const outputs = await Promise.all(htmlFiles.map(async (file) => {
    const path = join(root, "dist", file);
    try {
      const info = await stat(path);
      assert.ok(info.isFile() && info.size > 0, `empty or invalid HTML: ${path}`);
      return { path, time: info.mtimeMs };
    } catch (error) {
      throw new Error(`Missing or invalid build artifact: ${path}. Run pnpm run build before QA; this runner never builds.`, { cause: error });
    }
  }));
  const inputs = await Promise.all([
    "src", "public", "astro.config.mjs", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json",
  ].map((path) => newestInput(join(root, path))));
  const latest = inputs.reduce((a, b) => a.time > b.time ? a : b);
  const oldestOutput = outputs.reduce((a, b) => a.time < b.time ? a : b);
  assert.ok(oldestOutput.time >= latest.time,
    `dist is older than ${latest.path}. Run pnpm run build before QA. Freshness uses mtimes, not a reproducible-build proof.`);
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log([
      "Usage: node scripts/qa/run.mjs",
      "Requires a fresh pnpm run build; does not build or install anything.",
      "Starts an Astro programmatic preview on 127.0.0.1 with an ephemeral port, runs smoke and closes it.",
      "HIQNET_QA_WIDTHS=375,390,768,1024,1280,1440",
      "HIQNET_QA_TIMEOUT_MS=240000 (plus at most 10s for cancellation/cleanup)",
      "HIQNET_QA_SCREENSHOTS=1 enables .superpowers/qa-rebuild/*.png",
      "HIQNET_BASE_URL is ignored here: the runner always tests its own preview.",
    ].join("\n"));
    return;
  }

  const timeout = readTimeout();
  readWidths();
  process.chdir(root);
  process.env.ASTRO_TELEMETRY_DISABLED = "1";
  const controller = new AbortController();
  let server;
  let stopPromise;
  let forcedExit;
  const stopPreview = async () => {
    if (!server) return;
    stopPromise ??= server.stop();
    await stopPromise;
  };
  const cancel = (reason, code) => {
    if (controller.signal.aborted) return;
    process.exitCode = code;
    controller.abort(new Error(reason));
    // The server lives in this process, not an orphanable shell/background child.
    forcedExit = setTimeout(() => {
      console.error("QA cleanup exceeded 10s; terminating the preview process.");
      process.exit(code);
    }, 10_000);
    void stopPreview().catch((error) => console.error("Preview cancellation:", error.message));
  };
  const interrupt = () => cancel("QA interrupted (SIGINT)", 130);
  const terminate = () => cancel("QA terminated (SIGTERM)", 143);
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", terminate);
  const deadline = setTimeout(() => cancel(`QA exceeded ${timeout}ms`, 124), timeout);

  try {
    await assertFreshBuild();
    controller.signal.throwIfAborted();
    const [{ preview }, { default: config }] = await Promise.all([
      import("astro"),
      import(new URL("astro.config.mjs", rootUrl).href),
    ]);
    controller.signal.throwIfAborted();
    server = await preview({
      ...config,
      root,
      configFile: false,
      server: { ...config.server, host: "127.0.0.1", port: 0, open: false },
    });
    controller.signal.throwIfAborted();
    const baseUrl = `http://127.0.0.1:${server.port}`;
    const response = await fetch(`${baseUrl}/`, { signal: controller.signal });
    assert.equal(response.status, 200, `Preview readiness failed: HTTP ${response.status}`);
    await response.arrayBuffer();
    console.log(`QA preview: ${baseUrl}; deadline ${timeout}ms`);
    await runSmoke({ baseUrl, signal: controller.signal });
    controller.signal.throwIfAborted();
  } catch (error) {
    console.error(controller.signal.reason ?? error);
    process.exitCode ||= 1;
  } finally {
    // Bound cleanup independently even when a successful test leaves a stuck handle.
    const cleanupDeadline = setTimeout(() => {
      console.error("Preview cleanup exceeded 10s; terminating.");
      process.exit(process.exitCode || 1);
    }, 10_000);
    try {
      await stopPreview();
      if (server) {
        assert.equal(server.server?.listening, false, "Preview still listening after stop()");
        console.log("QA preview stopped.");
      }
    } catch (error) {
      console.error("Preview cleanup failed:", error);
      // A rejected stop() must not turn a failed QA command into a permanent server.
      process.exit(process.exitCode || 1);
    } finally {
      clearTimeout(cleanupDeadline);
      clearTimeout(deadline);
      clearTimeout(forcedExit);
      process.removeListener("SIGINT", interrupt);
      process.removeListener("SIGTERM", terminate);
    }
  }
}

await main().catch((error) => {
  console.error(error);
  process.exitCode ||= 1;
});
