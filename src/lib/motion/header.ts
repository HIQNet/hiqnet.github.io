/**
 * Header behaviour: a hairline appears once the page scrolls, and the current
 * section is marked for the navigation. Both are cheap, non-narrative updates.
 */
export function initHeader(): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (!header) return;

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".header__link"));
  if (links.length === 0 || !("IntersectionObserver" in window)) return;

  const targets = links
    .map((link) => {
      const id = decodeURIComponent(link.hash.replace(/^#/, ""));
      const section = id ? document.getElementById(id) : null;
      return section ? { link, section } : null;
    })
    .filter((entry): entry is { link: HTMLAnchorElement; section: HTMLElement } => entry !== null);

  if (targets.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const match = targets.find((target) => target.section === entry.target);
        if (!match) continue;
        links.forEach((link) => link.removeAttribute("aria-current"));
        match.link.setAttribute("aria-current", "true");
      }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );

  targets.forEach((target) => observer.observe(target.section));
}
