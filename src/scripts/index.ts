const clamp = (value: number) => Math.min(1, Math.max(0, value));
const phase = (progress: number, start: number, end: number) => clamp((progress - start) / (end - start));

function initializeInteractions() {
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia("(min-width: 64rem)");
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  const button = document.querySelector<HTMLButtonElement>("#menu-toggle");
  const menu = document.querySelector<HTMLElement>("#mobile-menu");
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const routing = document.querySelector<HTMLElement>("[data-hero-routing]");
  const story = document.querySelector<HTMLElement>("[data-story-visual]");
  const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-story-step]"));
  const caption = document.querySelector<HTMLElement>("[data-story-caption]");
  const contact = document.querySelector<HTMLElement>("#contacto");
  const persistent = document.querySelector<HTMLElement>("[data-persistent-cta]");
  const nav = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"));
  const sections = [...new Set(nav.map(link => link.dataset.navLink))]
    .flatMap(id => { const section = id ? document.querySelector<HTMLElement>(id) : null; return section ? [section] : []; });
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let currentStage = -1;

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
      if (!menu.hidden) { closeMenu(); return; }
      menu.hidden = false;
      document.body.classList.add("menu-open");
      button.setAttribute("aria-expanded", "true");
      const label = button.querySelector(".sr-only");
      if (label) label.textContent = "Cerrar menú";
    }, { signal });
    menu.addEventListener("click", event => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("a");
      if (!link) return;
      closeMenu();
      // Keep keyboard focus at the destination rather than inside a closed disclosure.
      if (link.hash && link.pathname === location.pathname) {
        const destination = document.getElementById(link.hash.slice(1));
        destination?.setAttribute("tabindex", "-1");
        destination?.focus({ preventScroll: true });
        destination?.addEventListener("blur", () => destination.removeAttribute("tabindex"), { once: true, signal });
      } else if (link.target === "_blank") button.focus();
    }, { signal });
    document.addEventListener("keydown", event => {
      if (menu.hidden) return;
      if (event.key === "Escape") { closeMenu(true); return; }
      if (event.key !== "Tab") return;
      const links = Array.from(menu.querySelectorAll<HTMLAnchorElement>("a[href]"));
      const last = links.at(-1);
      if (event.shiftKey && document.activeElement === button && last) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); button.focus(); }
    }, { signal });
    document.addEventListener("click", event => {
      if (menu.hidden || !(event.target instanceof Node)) return;
      if (!menu.contains(event.target) && !button.contains(event.target)) closeMenu();
    }, { signal });
  }

  function update() {
    frame = 0;
    header?.classList.toggle("is-scrolled", window.scrollY > 16);
    if (desktop.matches) closeMenu();
    let active = "";
    for (const section of sections) {
      const bounds = section.getBoundingClientRect();
      if (bounds.top < window.innerHeight * .5 && bounds.bottom > 120) active = `#${section.id}`;
    }
    nav.forEach(link => {
      const isActive = link.dataset.navLink === active;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    const heroBounds = hero?.getBoundingClientRect();
    if (routing) {
      routing.style.setProperty("--hero-progress", String(reduced.matches ? 0 : clamp(-(heroBounds?.top ?? 0) / (heroBounds?.height || 1))));
      routing.style.setProperty("--pointer-x", `${reduced.matches ? 0 : pointerX}px`);
      routing.style.setProperty("--pointer-y", `${reduced.matches ? 0 : pointerY}px`);
    }
    if (persistent && heroBounds && contact) {
      persistent.hidden = heroBounds.bottom > 80 || contact.getBoundingClientRect().top < innerHeight;
    }
    if (!story || !steps.length) return;
    if (reduced.matches || !desktop.matches) {
      ["--connection", "--flow", "--system", "--dispersion"].forEach(name => story.style.removeProperty(name));
      steps.forEach(step => step.classList.remove("is-current"));
      if (caption) caption.textContent = "Un sistema conectado";
      currentStage = -1;
      return;
    }
    const first = steps[0].getBoundingClientRect();
    const last = steps[steps.length - 1].getBoundingClientRect();
    const start = first.top + first.height * .5;
    const end = last.top + last.height * .5;
    const progress = clamp((innerHeight * .5 - start) / Math.max(1, end - start));
    story.style.setProperty("--dispersion", String(1 - phase(progress, 0, .3)));
    story.style.setProperty("--connection", String(phase(progress, .08, .34)));
    story.style.setProperty("--flow", String(phase(progress, .4, .67)));
    story.style.setProperty("--system", String(phase(progress, .73, 1)));
    const stage = Math.round(progress * 3);
    if (stage !== currentStage) {
      currentStage = stage;
      story.dataset.storyStage = String(stage + 1);
      steps.forEach((step, index) => step.classList.toggle("is-current", index === stage));
      if (caption) caption.textContent = ["01 / Dispersión", "02 / Conexión", "03 / Automatización", "04 / Sistema"][stage];
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  window.addEventListener("scroll", schedule, { passive: true, signal });
  window.addEventListener("resize", schedule, { passive: true, signal });
  desktop.addEventListener("change", schedule, { signal });
  reduced.addEventListener("change", () => {
    document.querySelectorAll(".is-entering").forEach(element => element.classList.remove("is-entering"));
    pointerX = pointerY = 0;
    schedule();
  }, { signal });
  hero?.addEventListener("pointermove", event => {
    if (reduced.matches || !pointer.matches) return;
    const bounds = hero.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / bounds.width - .5) * 6;
    pointerY = ((event.clientY - bounds.top) / bounds.height - .5) * 4;
    schedule();
  }, { passive: true, signal });
  hero?.addEventListener("pointerleave", () => { pointerX = pointerY = 0; schedule(); }, { signal });

  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!reduced.matches) entry.target.classList.add("is-entering");
      entry.target.classList.add("is-visible");
      reveal.unobserve(entry.target);
    });
  }, { threshold: .12 });
  document.querySelectorAll(".reveal").forEach(element => reveal.observe(element));
  document.addEventListener("animationend", event => {
    if (event.target instanceof Element) event.target.classList.remove("is-entering");
  }, { signal });
  document.addEventListener("click", event => {
    const element = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-event]") : null;
    if (element) window.dispatchEvent(new CustomEvent("hiqnet:conversion", { detail: { name: element.dataset.event } }));
  }, { signal });
  update();
  return () => {
    controller.abort();
    reveal.disconnect();
    cancelAnimationFrame(frame);
    closeMenu();
  };
}

let cleanup = initializeInteractions();
window.addEventListener("pagehide", () => cleanup());
window.addEventListener("pageshow", event => { if (event.persisted) cleanup = initializeInteractions(); });
