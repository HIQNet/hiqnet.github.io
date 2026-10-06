import { bindGsapLifecycle } from "./gsap-init";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

interface Rect { top: number; height: number; }

function initializeInteractions() {
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia("(min-width: 64rem)");
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");

  const header = document.querySelector<HTMLElement>("[data-site-header]");
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const routing = document.querySelector<HTMLElement>("[data-hero-routing]");
  const bridge = document.querySelector<HTMLElement>(".hero-friction-bridge");
  const frictionSignals = document.querySelector<HTMLElement>(
    "[data-friction-signals]",
  );
  const frictionFragments = document.querySelector<HTMLElement>(
    "[data-fragment-index]",
  );
  const methodSteps = document.querySelector<HTMLElement>("[data-method-steps]");
  const methodStepItems = Array.from(
    document.querySelectorAll<HTMLElement>("[data-method-step]"),
  );
  const engineeringLayers = document.querySelector<HTMLElement>(
    "[data-engineering-stack]",
  );
  const engineeringLayerItems = Array.from(
    engineeringLayers?.querySelectorAll<HTMLElement>("[data-engineering-layer]") ?? [],
  );
  const architectureLayers = document.querySelector<HTMLElement>(
    "[data-architecture-layers]",
  );
  const architectureLayerItems = Array.from(
    architectureLayers?.querySelectorAll<HTMLElement>("[data-architecture-layer]") ?? [],
  );
  // Each capability exposes one `.capability-block__visual` wrapper. The
  // observer below drives the entrance and (for Automate) the one-shot
  // pulse once the block crosses into the viewport.
  const capabilityVisuals = Array.from(
    document.querySelectorAll<HTMLElement>(".capability-block__visual"),
  );
  const persistent = document.querySelector<HTMLElement>("[data-persistent-cta]");
  const contact = document.querySelector<HTMLElement>("#contacto");

  const nav = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"),
  );
  // Sections are collected from `[data-nav-link]` hrefs (e.g. `#soluciones`).
  // The vertical Capabilities section now occupies the full `#soluciones`
  // id, so the active state matches the natural top of the section.
  const sections = [...new Set(nav.map((link) => link.dataset.navLink))]
    .flatMap((id) => {
      const section = id ? document.querySelector<HTMLElement>(id) : null;
      return section ? [section] : [];
    });

  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let reducedSnapshot = reduced.matches;

  function mid(bounds: Rect) { return bounds.top + bounds.height / 2; }

  function update() {
    frame = 0;
    header?.classList.toggle("is-scrolled", window.scrollY > 16);

    // Active section detection. Each section becomes active when its top
    // crosses past the upper third of the viewport, so the navbar reflects
    // what the user is actually reading.
    let active = "";
    for (const section of sections) {
      const bounds = section.getBoundingClientRect();
      if (bounds.top < innerHeight * 0.5 && bounds.bottom > 120) active = `#${section.id}`;
    }
    nav.forEach((link) => {
      const isActive = link.dataset.navLink === active;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });

    const heroBounds = hero?.getBoundingClientRect();
    if (routing && heroBounds) {
      const progress = clamp(-heroBounds.top / Math.max(heroBounds.height, 1));
      routing.style.setProperty("--hero-progress", String(reducedSnapshot ? 0 : progress));
      routing.style.setProperty("--pointer-x", `${reducedSnapshot ? 0 : pointerX}px`);
      routing.style.setProperty("--pointer-y", `${reducedSnapshot ? 0 : pointerY}px`);
    }

    if (bridge && heroBounds) {
      const bridgeBounds = bridge.getBoundingClientRect();
      const progress = clamp((innerHeight * 0.5 - mid(bridgeBounds)) / innerHeight);
      bridge.style.setProperty("--bridge-progress", String(reducedSnapshot ? 0 : progress));
    }

    if (persistent && heroBounds && contact) {
      const pastHero = heroBounds.bottom < 80;
      const nearContact = contact.getBoundingClientRect().top < innerHeight * 0.85;
      persistent.classList.toggle("is-visible", pastHero && !nearContact);
    }

    // The Story section is owned by GSAP (see gsap-init.ts). Its scroll-driven
    // animation is now handled by ScrollTrigger timelines; the legacy RAF
    // path is removed so it cannot fight the timeline.

    if (methodSteps && methodStepItems.length) {
      const firstRect = methodSteps.getBoundingClientRect();
      const lastRect = methodStepItems[methodStepItems.length - 1].getBoundingClientRect();
      const start = firstRect.top + 24;
      const end = mid(lastRect);
      const rawProgress = clamp((innerHeight * 0.6 - start) / Math.max(1, end - start));
      methodSteps.style.setProperty("--method-progress", String(smoothstep(rawProgress)));
      let activeIndex = -1;
      for (let index = 0; index < methodStepItems.length; index += 1) {
        const rect = methodStepItems[index].getBoundingClientRect();
        if (rect.top < innerHeight * 0.55) activeIndex = index;
      }
      methodStepItems.forEach((step, index) =>
        step.classList.toggle("is-current", index === activeIndex),
      );
    }

    if (engineeringLayers && engineeringLayerItems.length) {
      let activeIndex = -1;
      for (let index = 0; index < engineeringLayerItems.length; index += 1) {
        const rect = engineeringLayerItems[index].getBoundingClientRect();
        if (rect.top < innerHeight * 0.55) activeIndex = index;
      }
      engineeringLayerItems.forEach((layer, index) => {
        const isCurrent = index === activeIndex;
        layer.classList.toggle("is-current", isCurrent);
        layer.style.setProperty("--layer-emphasis", isCurrent ? "100" : "0");
      });
    }

    if (architectureLayers && architectureLayerItems.length) {
      let activeIndex = -1;
      for (let index = 0; index < architectureLayerItems.length; index += 1) {
        const rect = architectureLayerItems[index].getBoundingClientRect();
        if (rect.top < innerHeight * 0.7) activeIndex = index;
      }
      architectureLayerItems.forEach((layer, index) => {
        layer.classList.toggle("is-current", index === activeIndex);
      });
    }

    tickAmbient(performance.now());
  }

  // Ambient motion: discrete events with varied intervals across zones.
  // Each zone has its own scheduler; only one fires per tick to keep the
  // page restrained (max one event clearly perceptible at a time).
  interface AmbientZone {
    element: HTMLElement | null;
    duration: number;
    delayMin: number;
    delayMax: number;
    className: string;
    mobileEnabled: boolean;
  }
  const ambientZones: AmbientZone[] = [
    { element: routing, duration: 1300, delayMin: 4500, delayMax: 8000, className: "is-ambient-pulse", mobileEnabled: false },
    { element: routing, duration: 900, delayMin: 5500, delayMax: 9500, className: "is-ambient-status", mobileEnabled: true },
    { element: routing, duration: 1500, delayMin: 6500, delayMax: 11000, className: "is-ambient-cells", mobileEnabled: false },
    { element: document.querySelector<HTMLElement>(".story-software"), duration: 1500, delayMin: 6000, delayMax: 10500, className: "is-ambient", mobileEnabled: false },
    { element: document.querySelector<HTMLElement>("[data-web-frame]"), duration: 1700, delayMin: 5500, delayMax: 9000, className: "is-ambient", mobileEnabled: true },
    { element: document.querySelector<HTMLElement>("[data-automate-stage]"), duration: 1500, delayMin: 6500, delayMax: 10500, className: "automate-ambient", mobileEnabled: false },
    { element: document.querySelector<HTMLElement>("[data-business-frame]"), duration: 1500, delayMin: 6000, delayMax: 10000, className: "is-ambient", mobileEnabled: true },
    { element: document.querySelector<HTMLElement>("[data-architecture-layers]"), duration: 1700, delayMin: 7000, delayMax: 11000, className: "is-ambient", mobileEnabled: false },
    { element: contact, duration: 1700, delayMin: 7000, delayMax: 12000, className: "is-ambient", mobileEnabled: true },
  ];
  const nextAmbientFire = ambientZones.map((_, index) => performance.now() + 4500 + index * 1800);
  const ambientActiveUntil = ambientZones.map(() => 0);
  const mobileAmbient = matchMedia("(max-width: 47.999rem)");

  function tickAmbient(now: number) {
    if (reducedSnapshot) return;
    if (document.visibilityState !== "visible") return;
    let anyActive = false;
    for (let index = 0; index < ambientZones.length; index += 1) {
      const activeUntil = ambientActiveUntil[index];
      if (activeUntil && now > activeUntil) {
        ambientZones[index].element?.classList.remove(ambientZones[index].className);
        ambientActiveUntil[index] = 0;
      }
      if (activeUntil && now <= activeUntil) anyActive = true;
    }
    if (anyActive) return;
    for (let index = 0; index < ambientZones.length; index += 1) {
      const zone = ambientZones[index];
      if (!zone.element) continue;
      if (!zone.mobileEnabled && mobileAmbient.matches) continue;
      if (now < nextAmbientFire[index]) continue;
      const rect = zone.element.getBoundingClientRect();
      if (rect.bottom < -40 || rect.top > innerHeight + 40) {
        nextAmbientFire[index] = now + 1500;
        continue;
      }
      zone.element.classList.add(zone.className);
      ambientActiveUntil[index] = now + zone.duration;
      nextAmbientFire[index] = now + zone.delayMin + Math.random() * (zone.delayMax - zone.delayMin);
      break;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const now = performance.now();
    for (let index = 0; index < ambientZones.length; index += 1) {
      nextAmbientFire[index] = now + 4000 + index * 1500;
      if (ambientActiveUntil[index]) {
        ambientZones[index].element?.classList.remove(ambientZones[index].className);
        ambientActiveUntil[index] = 0;
      }
    }
    schedule();
  }, { signal });

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  window.addEventListener("scroll", schedule, { passive: true, signal });
  window.addEventListener("resize", schedule, { passive: true, signal });
  desktop.addEventListener("change", schedule, { signal });

  reduced.addEventListener("change", () => {
    reducedSnapshot = reduced.matches;
    document.querySelectorAll(".is-entering").forEach((element) =>
      element.classList.remove("is-entering"),
    );
    pointerX = pointerY = 0;
    schedule();
  }, { signal });

  hero?.addEventListener("pointermove", (event) => {
    if (reducedSnapshot || !pointer.matches) return;
    const bounds = hero.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 6;
    pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 4;
    schedule();
  }, { passive: true, signal });
  hero?.addEventListener("pointerleave", () => {
    pointerX = pointerY = 0;
    schedule();
  }, { signal });

  // IntersectionObserver gates: friction signals and fragments enter
  // sequentially, capability visuals draw-on, engineering / method become
  // contextual, and the discovery visual cycles its fragments.
  const sequential = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      sequential.unobserve(entry.target);
    });
  }, { threshold: 0.18 });
  if (frictionSignals) sequential.observe(frictionSignals);
  if (frictionFragments) sequential.observe(frictionFragments);

  const capabilityObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const visual = entry.target as HTMLElement;
      visual.classList.add("is-entering");
      // Automate: after the structural entrance, fire the one-shot
      // resolve pulse on the central process once.
      const block = visual.closest<HTMLElement>("[data-capability-block='automate']");
      if (block) {
        window.setTimeout(() => visual.classList.add("is-pulsing"), 220);
      }
      capabilityObserver.unobserve(visual);
    });
  }, { threshold: 0.28 });
  capabilityVisuals.forEach((element) => capabilityObserver.observe(element));

  // Discovery visual cycles focus on each fragment once visible.
  const discoveryVisuals = Array.from(
    document.querySelectorAll<HTMLElement>(".commercial-bridge__visual"),
  );
  const discoveryObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target as HTMLElement;
      const surface = element.querySelector("[data-discovery-surface]") as HTMLElement | null;
      if (surface) surface.classList.add("is-entering");
      discoveryObserver.unobserve(element);
    });
  }, { threshold: 0.32 });
  discoveryVisuals.forEach((element) => discoveryObserver.observe(element));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll<HTMLElement>(".reveal").forEach((element) =>
    revealObserver.observe(element),
  );

  document.addEventListener("click", (event) => {
    const element = event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-event]")
      : null;
    if (element) {
      window.dispatchEvent(new CustomEvent("hiqnet:conversion", { detail: { name: element.dataset.event } }));
    }
  }, { signal });

  // View Transitions API: progressive enhancement only when the browser
  // supports it. The handler calls the method directly on `document` so the
  // receiver is preserved; extracting it as a bare function reference
  // triggers `Illegal invocation` in V8.
  const viewTransition = (document as Document & {
    startViewTransition?: (callback?: () => void | Promise<void>) => unknown;
  }).startViewTransition;
  if (typeof viewTransition === "function") {
    document.querySelectorAll<HTMLAnchorElement>("a[href^='/proyectos/']").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        const destination = link.href;
        document.startViewTransition!(() => {
          location.href = destination;
        });
      }, { signal });
    });
  }

  update();
  return () => {
    controller.abort();
    revealObserver.disconnect();
    sequential.disconnect();
    capabilityObserver.disconnect();
    discoveryObserver.disconnect();
    cancelAnimationFrame(frame);
  };
}

export function startInteractions() {
  // Astro fires on initial load and after every view transition; we also
  // boot on `load` for direct document loads.
  if (document.readyState === "complete") initializeInteractions();
  else window.addEventListener("load", initializeInteractions, { once: true });
}

let cleanup = initializeInteractions();
window.addEventListener("pagehide", () => cleanup());
window.addEventListener("pageshow", (event) => {
  if (event.persisted) cleanup = initializeInteractions();
});

// GSAP feature ownership — the Story section's pinned scrub timeline.
// Mobile menu is now owned by the React island; capabilities is owned by
// the IntersectionObserver in this file.
bindGsapLifecycle();