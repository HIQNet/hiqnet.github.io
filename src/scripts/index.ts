import ScrollReveal from "scrollreveal";

const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");

function closeMobileMenu() {
  if (!mobileMenu || mobileMenu.classList.contains("hidden")) return;
  mobileMenu.classList.remove("scale-y-100");
  mobileMenu.classList.add("scale-y-0");
  window.setTimeout(() => mobileMenu.classList.add("hidden"), 300);
}

mobileMenuButton?.addEventListener("click", () => {
  if (!mobileMenu) return;
  if (mobileMenu.classList.contains("hidden")) {
    mobileMenu.classList.remove("hidden");
    void mobileMenu.offsetWidth;
    mobileMenu.classList.remove("scale-y-0");
    mobileMenu.classList.add("scale-y-100");
    return;
  }
  closeMobileMenu();
});

document.addEventListener("click", (event) => {
  if (mobileMenu && mobileMenuButton && !mobileMenu.contains(event.target as Node) && !mobileMenuButton.contains(event.target as Node)) {
    closeMobileMenu();
  }
});

document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const targetId = anchor.getAttribute("href");
    const targetElement = targetId ? document.querySelector(targetId) : null;
    if (!targetElement) return;
    event.preventDefault();
    window.scrollTo({ top: targetElement.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    closeMobileMenu();
  });
});

const scrollProgress = document.getElementById("scroll-progress");
const backToTop = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  if (scrollProgress) scrollProgress.style.width = `${(scrollTop / scrollHeight) * 100}%`;
  backToTop?.classList.toggle("visible", scrollTop > 300);
});

backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const testimonialTrack = document.getElementById("testimonial-track");
let currentSlide = 0;
const dots = [...document.querySelectorAll<HTMLElement>(".dot")];

function updateSlider() {
  if (testimonialTrack) testimonialTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  dots.forEach((dot, index) => {
    const active = index === currentSlide;
    dot.classList.toggle("active", active);
    dot.classList.toggle("bg-purple-500", active);
    dot.classList.toggle("dark:bg-purple-500", active);
    dot.classList.toggle("bg-purple-300", !active);
    dot.classList.toggle("dark:bg-purple-700", !active);
  });
}

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    currentSlide = Number.parseInt(dot.dataset.index ?? "0", 10);
    updateSlider();
  });
});

if (dots.length > 0) {
  window.setInterval(() => {
    currentSlide = (currentSlide + 1) % dots.length;
    updateSlider();
  }, 5000);
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {
  ScrollReveal().reveal("h1, h2, h3, h4, h5, h6", { delay: 50, distance: "8px", duration: 300, origin: "bottom", interval: 50 });
  ScrollReveal().reveal(".gradient-border, .gradient-bg", { delay: 80, distance: "10px", duration: 300, origin: "bottom", interval: 50 });
  ScrollReveal().reveal("p, li", { delay: 100, distance: "8px", duration: 300, origin: "bottom", interval: 50 });
}

// --- Filtros de servicios por objetivo ---

const serviceFilters = [...document.querySelectorAll<HTMLButtonElement>(".service-filter")];
const serviceCards = [...document.querySelectorAll<HTMLElement>(".service-card")];

function applyServiceFilter(objective: string) {
  for (const card of serviceCards) {
    const matches = objective === "all" || (card.dataset.objectives ?? "").split(" ").includes(objective);
    card.classList.toggle("hidden", !matches);
  }
  for (const filter of serviceFilters) {
    const active = filter.dataset.objective === objective;
    filter.setAttribute("aria-pressed", String(active));
    filter.classList.toggle("border-cyan-400/60", active);
    filter.classList.toggle("bg-cyan-400/10", active);
    filter.classList.toggle("text-cyan-300", active);
    filter.classList.toggle("border-slate-700", !active);
    filter.classList.toggle("text-slate-300", !active);
  }
}

for (const filter of serviceFilters) {
  filter.addEventListener("click", () => applyServiceFilter(filter.dataset.objective ?? "all"));
}

const video = document.getElementById("logoVideo") as HTMLVideoElement | null;
if (video) video.playbackRate = 1;
