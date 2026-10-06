/**
 * Mobile menu (vanilla). Toggles a disclosure panel with focus management:
 * first link focused on open, Tab trapped inside, Escape closes, body lock.
 * Without JavaScript the panel stays closed and the `noscript` nav in the
 * header takes over.
 */
export function initMobileMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const panel = document.querySelector<HTMLElement>("[data-menu-panel]");
  if (!toggle || !panel) return;

  const FOCUSABLE = "a[href], button:not([disabled])";
  let open = false;

  const setOpen = (next: boolean) => {
    open = next;
    toggle.setAttribute("aria-expanded", String(next));
    panel.setAttribute("data-open", String(next));
    document.body.classList.toggle("is-locked", next);
    if (next) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    } else {
      toggle.focus();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null,
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  toggle.addEventListener("click", () => setOpen(!open));
  document.addEventListener("keydown", (event) => {
    if (open) onKeyDown(event);
  });

  // Close when reaching the desktop layout.
  const query = window.matchMedia("(min-width: 64rem)");
  const onChange = () => {
    if (query.matches) setOpen(false);
  };
  query.addEventListener("change", onChange);
}
