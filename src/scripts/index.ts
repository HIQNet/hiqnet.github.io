const clamp = (value: number) => Math.min(1, Math.max(0, value));
const phase = (progress: number, start: number, end: number) =>
  clamp((progress - start) / (end - start));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

interface Rect { top: number; height: number; }

function initializeInteractions() {
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia("(min-width: 64rem)");
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");

  const root = document.documentElement;
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  const button = document.querySelector<HTMLButtonElement>("#menu-toggle");
  const menu = document.querySelector<HTMLElement>("#mobile-menu");
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const routing = document.querySelector<HTMLElement>("[data-hero-routing]");
  const bridge = document.querySelector<HTMLElement>(".hero-friction-bridge");
  const story = document.querySelector<HTMLElement>("[data-story-visual]");
  const steps = Array.from(
    document.querySelectorAll<HTMLElement>("[data-story-step]"),
  );
  const caption = document.querySelector<HTMLElement>("[data-story-caption]");
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
    "[data-engineering-layers]",
  );
  const engineeringLayerItems = Array.from(
    document.querySelectorAll<HTMLElement>("[data-engineering-layer]"),
  );
  const capabilityVisuals = Array.from(
    document.querySelectorAll<HTMLElement>(".capability-visual"),
  );
  const persistent = document.querySelector<HTMLElement>("[data-persistent-cta]");
  const contact = document.querySelector<HTMLElement>("#contacto");
  const storyDiagram = story?.querySelector<HTMLElement>(".operation-diagram") ?? null;

  const nav = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"),
  );
  const sections = [...new Set(nav.map((link) => link.dataset.navLink))]
    .flatMap((id) => {
      const section = id ? document.querySelector<HTMLElement>(id) : null;
      return section ? [section] : [];
    });

  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let currentStage = -1;
  let reducedSnapshot = reduced.matches;

  function closeMenu(restoreFocus = false) {
    if (!button || !menu) return;
    const wasOpen = !menu.hidden;
    menu.hidden = true;
    document.body.classList.remove("menu-open");
    button.setAttribute("aria-expanded", "false");
    const label = button.querySelector(".sr-only");
    if (label) label.textContent = "Abrir menú";
    if (wasOpen && restoreFocus) button.focus();
  }

  if (button && menu) {
    button.hidden = false;
    button.addEventListener("click", () => {
      if (!menu.hidden) {
        closeMenu();
        return;
      }
      menu.hidden = false;
      document.body.classList.add("menu-open");
      button.setAttribute("aria-expanded", "true");
      const label = button.querySelector(".sr-only");
      if (label) label.textContent = "Cerrar menú";
    }, { signal });
    menu.addEventListener("click", (event) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("a");
      if (!link) return;
      closeMenu();
      if (link.hash && link.pathname === location.pathname) {
        const destination = document.getElementById(link.hash.slice(1));
        destination?.setAttribute("tabindex", "-1");
        destination?.focus({ preventScroll: true });
        destination?.addEventListener(
          "blur",
          () => destination.removeAttribute("tabindex"),
          { once: true, signal },
        );
      } else if (link.target === "_blank") {
        button.focus();
      }
    }, { signal });
    document.addEventListener("keydown", (event) => {
      if (menu.hidden) return;
      if (event.key === "Escape") {
        closeMenu(true);
        return;
      }
      if (event.key !== "Tab") return;
      const links = Array.from(
        menu.querySelectorAll<HTMLAnchorElement>("a[href]"),
      );
      const last = links.at(-1);
      if (event.shiftKey && document.activeElement === button && last) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        button.focus();
      }
    }, { signal });
    document.addEventListener("click", (event) => {
      if (menu.hidden || !(event.target instanceof Node)) return;
      if (!menu.contains(event.target) && !button.contains(event.target)) closeMenu();
    }, { signal });
  }

  function mid(bounds: Rect) { return bounds.top + bounds.height / 2; }

  function update() {
    frame = 0;
    header?.classList.toggle("is-scrolled", window.scrollY > 16);
    if (desktop.matches) closeMenu();

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

    if (story && steps.length && desktop.matches && !reducedSnapshot) {
      const firstRect = steps[0].getBoundingClientRect();
      const lastRect = steps[steps.length - 1].getBoundingClientRect();
      const start = mid(firstRect);
      const end = mid(lastRect);
      const rawProgress = clamp((innerHeight * 0.5 - start) / Math.max(1, end - start));
      // Smoothstep blends the four phases so the eye perceives a single continuous
      // transformation rather than four discrete jumps.
      const progress = smoothstep(rawProgress);
      story.style.setProperty("--dispersion", String(clamp(1 - phase(rawProgress, 0, 0.22))));
      story.style.setProperty("--connection", String(phase(progress, 0.18, 0.55)));
      story.style.setProperty("--flow", String(phase(progress, 0.45, 0.78)));
      story.style.setProperty("--system", String(phase(progress, 0.72, 1)));
      const stage = Math.round(progress * (steps.length - 1));
      if (stage !== currentStage) {
        currentStage = stage;
        story.dataset.storyStage = String(stage + 1);
        steps.forEach((step, index) => step.classList.toggle("is-current", index === stage));
        if (caption) {
          caption.textContent = [
            "01 / Dispersión",
            "02 / Conexión",
            "03 / Automatización",
            "04 / Sistema",
          ][stage];
        }
      }
      const resolved = Number(story.style.getPropertyValue("--system")) || 0;
      if (resolved > 0.92) story.classList.add("is-system");
      else story.classList.remove("is-system");
    } else if (story) {
      ["--connection", "--flow", "--system", "--dispersion"].forEach((name) =>
        story.style.removeProperty(name),
      );
      story.classList.remove("is-system");
      steps.forEach((step) => step.classList.remove("is-current"));
      if (caption) caption.textContent = "Un sistema conectado";
      currentStage = -1;
    }

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

    // Ambient motion: discrete events with varied intervals. Driven by the same
    // RAF as scroll-driven motion; only fires when its zone is visible, the tab is
    // foreground, and reduced motion is not requested.
    tickAmbient(performance.now());
  }

  // Ambient motion: discrete events with varied intervals across three zones.
  // Each zone has its own scheduler; only one fires per tick to keep the page
  // restrained (max one event clearly perceptible at a time).
  interface AmbientZone {
    element: HTMLElement | null;
    duration: number;
    delayMin: number;
    delayMax: number;
    className: string;
    mobileEnabled: boolean;
    requiresSystem?: boolean;
  }
  const ambientZones: AmbientZone[] = [
    { element: routing, duration: 900, delayMin: 4500, delayMax: 8500, className: "is-ambient", mobileEnabled: true },
    { element: storyDiagram, duration: 1100, delayMin: 5500, delayMax: 9500, className: "is-ambient", mobileEnabled: false, requiresSystem: true },
    { element: contact, duration: 1500, delayMin: 6000, delayMax: 11000, className: "is-ambient", mobileEnabled: false },
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
      if (zone.requiresSystem) {
        const systemProgress = Number(zone.element.style.getPropertyValue("--system")) || 0;
        if (systemProgress < 0.6) {
          nextAmbientFire[index] = now + 1500;
          continue;
        }
      }
      zone.element.classList.add(zone.className);
      ambientActiveUntil[index] = now + zone.duration;
      nextAmbientFire[index] = now + zone.delayMin + Math.random() * (zone.delayMax - zone.delayMin);
      break;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    // Reset schedules when returning to the tab so we don't burst-fire events.
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

  // IntersectionObserver gates: friction signals and fragments enter sequentially,
  // capability visuals draw-on, engineering / method become contextual.
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
      const element = entry.target as HTMLElement;
      element.classList.add("is-entering");
      if (element.classList.contains("capability-automate") ||
          element.closest("article")?.id === "hiqnet-automate") {
        const visual = element.querySelector(".capability-visual") as HTMLElement | null;
        if (visual) {
          window.setTimeout(() => visual.classList.add("is-pulsing"), 120);
        }
      }
      capabilityObserver.unobserve(element);
    });
  }, { threshold: 0.32 });
  capabilityVisuals.forEach((element) => capabilityObserver.observe(element));

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

  // View Transitions API: progressive enhancement only when the browser supports it.
  // The handler calls the method directly on `document` so the receiver is preserved;
  // extracting it as a bare function reference triggers `Illegal invocation` in V8.
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
    cancelAnimationFrame(frame);
    closeMenu();
  };
}

let cleanup = initializeInteractions();
window.addEventListener("pagehide", () => cleanup());
window.addEventListener("pageshow", (event) => {
  if (event.persisted) cleanup = initializeInteractions();
});