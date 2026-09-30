const menuButton = document.querySelector<HTMLButtonElement>("#menu-toggle");
const menu = document.querySelector<HTMLElement>("#mobile-menu");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const closeMenu = (restoreFocus = false) => {
  if (!menuButton || !menu || menu.hidden) return;
  menu.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.querySelector(".sr-only")!.textContent = "Abrir menú";
  if (restoreFocus) menuButton.focus();
};

const toggleMenu = () => {
  if (!menuButton || !menu) return;
  const isOpen = menu.hidden;
  menu.hidden = !isOpen;
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.querySelector(".sr-only")!.textContent = isOpen ? "Cerrar menú" : "Abrir menú";
  if (!isOpen) menuButton.focus();
};

menuButton?.addEventListener("click", toggleMenu);
menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu(true);
});
document.addEventListener("click", (event) => {
  if (!menuButton || !menu || menu.hidden) return;
  const target = event.target as Node;
  if (!menu.contains(target) && !menuButton.contains(target)) closeMenu();
});

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const stageProgress = (progress: number, start: number, end: number) => clamp((progress - start) / (end - start));

const brandAnimation = document.querySelector<HTMLImageElement>("[data-brand-animation]");
const brandPoster = brandAnimation?.dataset.brandPoster || brandAnimation?.currentSrc || brandAnimation?.src;

if (brandAnimation && brandPoster) {
  const setBrandSource = () => {
    const source = prefersReducedMotion.matches
      ? brandPoster
      : brandAnimation.dataset.brandAnimation;
    if (source && brandAnimation.getAttribute("src") !== source) brandAnimation.src = source;
  };
  brandAnimation.addEventListener("error", () => { brandAnimation.src = brandPoster; }, { once: true });
  setBrandSource();
  prefersReducedMotion.addEventListener("change", setBrandSource);
}

if (!prefersReducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll<HTMLElement>(".reveal, .card-reveal, .editorial-reveal, [data-motion]").forEach((element) => revealObserver.observe(element));

  const storySection = document.querySelector<HTMLElement>("[data-story-section]");
  const storyVisual = document.querySelector<HTMLElement>("[data-story-visual]");
  const storySteps = Array.from(document.querySelectorAll<HTMLElement>("[data-story-step]"));
  const storyStepsElement = document.querySelector<HTMLElement>("[data-story-steps]");
  const desktopStory = window.matchMedia("(min-width: 64rem)");

  if (storySection && storyVisual && storyStepsElement && storySteps.length > 0) {
    const setActiveStep = (stage: number) => {
      storyVisual.dataset.storyStage = String(stage);
      storySteps.forEach((step, index) => step.classList.toggle("is-current", index === stage - 1));
    };
    let teardownStory = () => {};

    const setUpStory = () => {
      teardownStory();
      storyVisual.style.removeProperty("--story-progress");
      storyVisual.style.removeProperty("--story-source");
      storyVisual.style.removeProperty("--story-connection");
      storyVisual.style.removeProperty("--story-flow");
      storyVisual.style.removeProperty("--story-system");
      storyVisual.style.removeProperty("--story-core-scale");
      storyVisual.style.removeProperty("--story-source-scale");
      storyVisual.style.removeProperty("--story-flow-scale");
      storyStepsElement.style.removeProperty("--story-progress-percent");

      if (!desktopStory.matches) {
        const stepObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            setActiveStep(Number((entry.target as HTMLElement).dataset.storyStep ?? "1"));
          });
        }, { rootMargin: "-30% 0px -45% 0px", threshold: 0 });
        storySteps.forEach((step) => stepObserver.observe(step));
        teardownStory = () => stepObserver.disconnect();
        return;
      }

      let frameRequested = false;
      const updateStory = () => {
        frameRequested = false;
        const bounds = storySection.getBoundingClientRect();
        const availableDistance = Math.max(bounds.height - window.innerHeight * 0.45, 1);
        const progress = clamp((window.innerHeight * 0.55 - bounds.top) / availableDistance);
        const connection = stageProgress(progress, 0.18, 0.48);
        const flow = stageProgress(progress, 0.45, 0.73);
        const system = stageProgress(progress, 0.68, 0.92);
        const source = 1 - progress * 0.12;
        const stage = Math.min(4, Math.floor(progress * 4) + 1);

        storyVisual.style.setProperty("--story-progress", String(progress));
        storyVisual.style.setProperty("--story-source", String(source));
        storyVisual.style.setProperty("--story-connection", String(connection));
        storyVisual.style.setProperty("--story-flow", String(flow));
        storyVisual.style.setProperty("--story-system", String(system));
        storyVisual.style.setProperty("--story-core-scale", String(0.88 + connection * 0.12));
        storyVisual.style.setProperty("--story-source-scale", String(0.96 + source * 0.04));
        storyVisual.style.setProperty("--story-flow-scale", String(0.94 + flow * 0.06));
        storyStepsElement.style.setProperty("--story-progress-percent", `${progress * 100}%`);
        setActiveStep(stage);
      };
      const scheduleStoryUpdate = () => {
        if (!frameRequested) {
          frameRequested = true;
          window.requestAnimationFrame(updateStory);
        }
      };
      const resizeObserver = new ResizeObserver(scheduleStoryUpdate);
      resizeObserver.observe(storySection);
      window.addEventListener("scroll", scheduleStoryUpdate, { passive: true });
      window.addEventListener("resize", scheduleStoryUpdate, { passive: true });
      scheduleStoryUpdate();
      teardownStory = () => {
        resizeObserver.disconnect();
        window.removeEventListener("scroll", scheduleStoryUpdate);
        window.removeEventListener("resize", scheduleStoryUpdate);
      };
    };

    desktopStory.addEventListener("change", setUpStory);
    setUpStory();
  }
}

document.querySelectorAll<HTMLElement>("[data-event]").forEach((element) => {
  element.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("hiqnet:conversion", { detail: { name: element.dataset.event } }));
  });
});
