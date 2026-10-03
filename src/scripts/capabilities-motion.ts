import { getGsap } from "./gsap-context";

/**
 * Capabilities motion — horizontal scrubbing.
 *
 * On desktop (>= 1024px) the section pins and translates its inner track
 * leftward as the user scrolls vertically. The translation maps scroll
 * progress to a `none` ease so wheel + trackpad stay continuous.
 *
 * Each panel's internal scene (sidebar rising, tasks flying in, modules
 * integrating) keeps its existing IntersectionObserver logic; the GSAP
 * timeline only owns the horizontal motion.
 */

const DESKTOP_BREAKPOINT = "(min-width: 64rem)"; // >= 1024px

export interface CapabilitiesMotionHandle {
  destroy(): void;
  refresh(): void;
}

export function initCapabilitiesMotion(root: HTMLElement): CapabilitiesMotionHandle {
  const gsap = getGsap();
  const track = root.querySelector<HTMLElement>("[data-cap-track]");
  const pinned = root.querySelector<HTMLElement>("[data-cap-pinned]");
  const indicator = root.querySelector<HTMLElement>("[data-cap-indicator]");
  const panels = Array.from(
    root.querySelectorAll<HTMLElement>("[data-cap-panel]"),
  );
  if (!track || !pinned || panels.length === 0) {
    return { destroy() {}, refresh() {} };
  }

  const mm = gsap.matchMedia();
  const owned: ScrollTrigger[] = [];

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Skip the entire GSAP motion for reduced motion; the panel layout
      // already falls back to vertical via CSS media queries.
      return { destroy() {}, refresh() {} };
    }

    mm.add(DESKTOP_BREAKPOINT, () => {
    const setup = () => {
      // Width-driven scrub distance: track length minus one viewport, plus
      // one gutter so the last panel can centre inside the viewport at the
      // end of the scrub (its natural right gutter mirrors the left one).
      const viewportWidth = window.innerWidth;
      const lastPanel = panels[panels.length - 1];
      const lastPanelRight = lastPanel.getBoundingClientRect().right;
      // Distance to translate so the last panel's right edge sits at the
      // viewport's right edge.
      const distance = Math.max(0, lastPanelRight - viewportWidth + 64);

      gsap.set(track, { x: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: pinned,
          start: "top top+=80",
          end: () => `+=${distance}`,
          pin: true,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 0,
          invalidateOnRefresh: true,
        },
      });
      const trigger = tl.scrollTrigger;
      if (trigger) owned.push(trigger);

      tl.set(track, { x: 0 }, 0);
      tl.to(track, { x: -distance, ease: "none" }, 0);

      if (indicator) {
        // Flip the `data-cap-panel` marker; CSS lights the active segment.
        // No visible text mutation, so no-JS / blocked-bundle baselines stay
        // identical to the JS baseline.
        tl.eventCallback("onUpdate", () => {
          const progress = tl.progress();
          const index = Math.min(3, Math.floor(progress * 3));
          indicator.dataset.capPanel = String(index + 1);
        });
      }

      return () => {
        tl.eventCallback("onUpdate", null);
      };
    };

    const revert = setup();
    return revert;
  });

  // Mobile: clear any inline translate so the panels stack vertically.
  mm.add("(max-width: 63.998rem)", () => {
    gsap.set(track, { clearProps: "all" });
    return () => {};
  });

  return {
    destroy() {
      mm.revert();
    },
    refresh() {
      owned.forEach((trigger) => trigger.refresh());
    },
  };
}