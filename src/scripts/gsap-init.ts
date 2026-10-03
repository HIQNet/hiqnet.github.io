import { getScrollTrigger } from "./gsap-context";
import { initStoryMotion, type StoryMotionHandle } from "./story-motion";
import { initCapabilitiesMotion, type CapabilitiesMotionHandle } from "./capabilities-motion";

/**
 * GSAP feature bootstrap.
 *
 * Owns the Story + Capabilities motion handles. Idempotent: calling init()
 * while a previous run is still alive will tear the old one down first.
 *
 * Astro lifecycle:
 *   - `astro:page-load` -> init() once the new page is in the DOM
 *   - `astro:before-swap` -> destroy() before the next page takes over
 *
 * We deliberately do NOT call ScrollTrigger.getAll().kill() because that
 * would also kill triggers owned by other scripts. Each handle keeps its
 * own list of triggers and only kills those.
 *
 * Reduced motion: when `prefers-reduced-motion: reduce` toggles, we
 * re-evaluate the GSAP setups. We register a single shared media query
 * listener and rebind everything on change.
 */

interface Handle {
  story: StoryMotionHandle | null;
  capabilities: CapabilitiesMotionHandle | null;
}

let handle: Handle | null = null;
let reducedMotionMql: MediaQueryList | null = null;
let reducedMotionListener: ((event: MediaQueryListEvent) => void) | null = null;

function teardown() {
  if (!handle) return;
  handle.story?.destroy();
  handle.capabilities?.destroy();
  handle = null;
  if (reducedMotionMql && reducedMotionListener) {
    reducedMotionMql.removeEventListener("change", reducedMotionListener);
    reducedMotionMql = null;
    reducedMotionListener = null;
  }
}

function init() {
  teardown();
  const storySection = document.querySelector<HTMLElement>("[data-story-section]");
  const capabilitiesSection = document.querySelector<HTMLElement>("[data-capabilities]");

  handle = {
    story: storySection ? initStoryMotion(storySection) : null,
    capabilities: capabilitiesSection ? initCapabilitiesMotion(capabilitiesSection) : null,
  };

  // Re-init on reduced-motion flips so the GSAP setup that respects it
  // can take effect when the user toggles their OS preference at runtime.
  reducedMotionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotionListener = () => init();
  reducedMotionMql.addEventListener("change", reducedMotionListener);

  // Refresh ScrollTrigger after the page has settled (fonts + images) so
  // pinned start/end positions reflect the real layout.
  const ScrollTrigger = getScrollTrigger();
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

export function bindGsapLifecycle() {
  // Astro fires these on initial load + after every view transition.
  document.addEventListener("astro:page-load", () => init());
  // Tear down before the swap so we never leak ScrollTriggers across pages.
  document.addEventListener("astro:before-swap", () => teardown());

  // Initial load (when Astro doesn't fire astro:page-load on first paint).
  if (document.readyState === "complete") init();
  else window.addEventListener("load", () => init(), { once: true });
}

export function cleanupGsap() {
  teardown();
}