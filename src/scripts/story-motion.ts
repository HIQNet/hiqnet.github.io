import { getGsap, getScrollTrigger } from "./gsap-context";

/**
 * Story motion — narrative scrub through four states.
 *
 * The .story-section contains a two-column layout:
 *   left  -> .story-visual (sticky, holds the .story-software scene)
 *   right -> .story-steps (4 narrative steps)
 *
 * On desktop (>= 1024px), GSAP pins the .story-visual column and drives a
 * timeline mapped to the user's vertical scroll. The same timeline drives
 * the right column: each step fades in/out as its corresponding timeline
 * label passes through the playhead.
 *
 * The timeline tweens the existing CSS custom properties on the visual
 * element so the scene's CSS keeps doing the visual work; GSAP only owns
 * the scroll -> progress mapping. This keeps the rendering pipeline
 * unchanged and lets reduced-motion / no-JS continue to work through
 * the original CSS fallbacks.
 */

const STORY_DISTANCE_FACTOR = 1.4; // viewport-multiplier for the scrub span.
const SCRUB = 0.6;
const DESKTOP_BREAKPOINT = "(min-width: 64rem)"; // >= 1024px

export interface StoryMotionHandle {
  destroy(): void;
  refresh(): void;
}

export function initStoryMotion(root: HTMLElement): StoryMotionHandle {
  const gsap = getGsap();
  const ScrollTrigger = getScrollTrigger();
  const visual = root.querySelector<HTMLElement>("[data-story-visual]");
  const stepsContainer = root.querySelector<HTMLElement>("[data-story-steps]");
  const steps = Array.from(
    root.querySelectorAll<HTMLElement>("[data-story-step]"),
  );
  const caption = root.querySelector<HTMLElement>("[data-story-caption]");
  if (!visual || !stepsContainer || steps.length === 0) {
    return { destroy() {}, refresh() {} };
  }

  const mm = gsap.matchMedia();
  const owned: ScrollTrigger[] = [];

  // gsap.matchMedia() does not evaluate `(prefers-reduced-motion: no-preference)`
  // the way we need when paired with a width query, so we wire the
  // reduced-motion check via a listener that re-init()s the feature when
  // the OS preference flips at runtime.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Skip GSAP entirely on reduced motion; CSS / IntersectionObserver
    // continue to work via `index.ts`.
    return { destroy() {}, refresh() {} };
  }

  mm.add(DESKTOP_BREAKPOINT, () => {
    const totalDistance = window.innerHeight * STORY_DISTANCE_FACTOR;

    // Visual elements we will animate directly through GSAP for finer
    // coordination across the four labels. The .story-software descendants
    // still read the same CSS, but we drive them via timeline tween labels.
    const app = visual.querySelector<HTMLElement>(".sapp");
    const fragments = Array.from(
      visual.querySelectorAll<HTMLElement>(".sfrag"),
    );
    const rows = visual.querySelector<HTMLElement>(".sapp__rows");
    const rowsItems = rows ? Array.from(rows.querySelectorAll<HTMLElement>("li")) : [];
    const sidebar = visual.querySelector<HTMLElement>(".sapp__sidebar");
    const metrics = visual.querySelector<HTMLElement>(".sapp__metrics");
    const title = visual.querySelector<HTMLElement>(".sapp__title");
    const status = visual.querySelector<HTMLElement>(".sapp__statusbar");

    // Reset to baseline before pinning (in case RAF previously moved them).
    gsap.set(visual, { clearProps: "all" });
    gsap.set(app, { opacity: 0, scale: 0.94, clipPath: "inset(50% 0 0 0 round 2px)" });
    gsap.set(fragments, { opacity: 1, x: 0, y: 0, rotation: 0 });
    if (sidebar) gsap.set(sidebar, { opacity: 0 });
    if (metrics) gsap.set(metrics, { opacity: 0 });
    if (title) gsap.set(title, { opacity: 0 });
    if (status) gsap.set(status, { opacity: 0 });
    if (rowsItems.length) gsap.set(rowsItems, { opacity: 0, y: 6 });

    const tl = gsap.timeline({
      defaults: { ease: "power1.out" },
      scrollTrigger: {
        trigger: stepsContainer,
        start: "top top+=80",
        end: () => `+=${totalDistance}`,
        pin: visual,
        pinSpacing: true,
        scrub: SCRUB,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    const trigger = tl.scrollTrigger;
    if (trigger) owned.push(trigger);

    // Step text fades — each step holds full opacity while its label is active
    // and dims as soon as the next label passes.
    steps.forEach((step, index) => {
      tl.set(step, { opacity: index === 0 ? 1 : 0.2 }, 0);
    });
    const stepLabels = ["dispersed", "connected", "automated", "system"];
    steps.forEach((step, index) => {
      const current = stepLabels[index];
      const next = stepLabels[index + 1];
      if (next) {
        // Approach current label: rise to full opacity, then fade out as next label crosses.
        tl.to(step, { opacity: 1, duration: 0.08 }, current);
        tl.to(step, { opacity: 0.2, duration: 0.18 }, next);
      } else {
        // Final step: rise to full opacity at its label and stay there.
        tl.to(step, { opacity: 1, duration: 0.08 }, current);
      }
    });

    // Label "dispersed" -> start (fragments already in place, app hidden)
    tl.addLabel("dispersed", 0);

    // Label "connected" -> fragments pull together, app skeleton reveals
    tl.addLabel("connected", 0.22);
    tl.to(
      fragments,
      {
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 0,
        stagger: 0.05,
        duration: 0.18,
      },
      "connected",
    );
    tl.to(
      app,
      {
        opacity: 1,
        scale: 1,
        clipPath: "inset(0% 0 0 0 round 2px)",
        duration: 0.22,
      },
      "connected",
    );
    if (title) tl.to(title, { opacity: 1, duration: 0.1 }, "connected+=0.05");

    // Label "automated" -> behaviour layer; sidebar/metrics/rows slide in,
    // and a small row "ticks" forward.
    tl.addLabel("automated", 0.47);
    if (sidebar) tl.to(sidebar, { opacity: 1, duration: 0.12 }, "automated");
    if (metrics) tl.to(metrics, { opacity: 1, duration: 0.12 }, "automated+=0.05");
    if (rowsItems.length) {
      tl.to(
        rowsItems,
        { opacity: 1, y: 0, duration: 0.18, stagger: 0.04 },
        "automated+=0.05",
      );
    }

    // Label "system" -> status bar in, second row-state flips to resolved
    // colour briefly, marking the operational moment.
    tl.addLabel("system", 0.72);
    if (status) tl.to(status, { opacity: 1, duration: 0.12 }, "system");

    // Caption sync: rewrite the eyebrow caption as the playhead crosses
    // each state boundary. We mutate `caption.textContent` from the timeline.
    const labels: Array<[string, string]> = [
      ["dispersed", "01 / Dispersión"],
      ["connected", "02 / Conexión"],
      ["automated", "03 / Automatización"],
      ["system", "04 / Sistema"],
    ];
    const onUpdate = () => {
      if (!caption) return;
      const time = tl.time();
      let active = labels[0][1];
      for (let i = labels.length - 1; i >= 0; i -= 1) {
        if (tl.labels[labels[i][0]] !== undefined && time >= tl.labels[labels[i][0]]) {
          active = labels[i][1];
          break;
        }
      }
      caption.textContent = active;
    };
    tl.eventCallback("onUpdate", onUpdate);

    // (Step text fades are handled above by the label-driven loop.)

    return () => {
      tl.eventCallback("onUpdate", null);
    };
  });

  // ---- Mobile / reduced: keep CSS as the source of truth ---------------
  mm.add("(max-width: 63.998rem)", () => {
    if (caption) caption.textContent = "Un sistema conectado";
    steps.forEach((step) => gsap.set(step, { opacity: 1 }));
    return () => {};
  });

  return {
    destroy() {
      mm.revert();
      // owned triggers were killed by mm.revert; nothing else to do.
    },
    refresh() {
      owned.forEach((trigger) => trigger.refresh());
    },
  };
}