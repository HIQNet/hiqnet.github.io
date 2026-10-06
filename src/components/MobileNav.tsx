import { useCallback, useEffect, useRef, useState } from "react";
import { Squash as Hamburger } from "hamburger-react";
import Icon from "./common/Icon";

/**
 * Mobile navigation disclosure.
 *
 * The Squash icon (from hamburger-react) is the disclosure trigger — it
 * renders an interactive div with `role="button"`, click, Enter and Space
 * handling already wired up. We forward the stable `id`, the
 * `.menu-toggle` styling hook, and `aria-controls` after mount so external
 * observers and tests can still address the trigger without inspecting the
 * component's internals.
 */

export interface MobileNavLink {
  href: string;
  label: string;
}

interface Props {
  links: readonly MobileNavLink[];
  whatsappHref: string;
}

export default function MobileNav({ links, whatsappHref }: Props) {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  // The wrapper is non-focusable; the inner Squash div is the real button.
  // We still keep a ref to find the trigger from the DOM (id + class) so
  // external observers and the test suite have a stable handle.
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Squash renders an internal `<div role="button">`. After it mounts we
  // forward `id="menu-toggle"`, the `.menu-toggle` class, and
  // `aria-controls` so the trigger stays addressable. The component keeps
  // its own `aria-expanded` / `aria-label` in sync with the toggled prop.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const trigger = wrapper.querySelector<HTMLElement>("[role='button']");
    if (!trigger) return;
    trigger.id = "menu-toggle";
    trigger.classList.add("menu-toggle");
    trigger.setAttribute("aria-controls", "mobile-menu");
  });

  const close = useCallback((restoreFocus = false) => {
    const trigger = wrapperRef.current?.querySelector<HTMLElement>("[role='button']");
    // Capture focus on the trigger before React commits the new state, so
    // the browser doesn't drop it to body when the menu becomes hidden.
    if (restoreFocus && trigger) trigger.focus({ preventScroll: true });
    setOpen(false);
  }, []);

  // Body scroll lock: only when the disclosure covers content.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.classList.add("menu-open");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("menu-open");
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes the menu. Tab + Shift+Tab cycle the focus back to the
  // disclosure trigger so keyboard users never lose the menu (the
  // disclosure is intentionally non-modal, so we keep the trap light).
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== "Tab") return;
      const trigger = wrapperRef.current?.querySelector<HTMLElement>("[role='button']");
      if (!trigger) return;
      const items = Array.from(
        navRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? [],
      );
      const last = items.at(-1);
      const first = items[0];
      const active = document.activeElement;
      if (event.shiftKey && active === trigger && last) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        trigger.focus();
      } else if (event.shiftKey && active === first) {
        // Shift+Tab from the first item should land on the trigger instead
        // of escaping into the desktop nav links.
        event.preventDefault();
        trigger.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Click outside the disclosure closes it.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (navRef.current?.contains(target)) return;
      if (wrapperRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("click", onPointer);
    return () => document.removeEventListener("click", onPointer);
  }, [open, close]);

  // Cross breakpoint: media query hides the disclosure at >=1024px; keep
  // state in sync so a future open starts from `false`.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, [close]);

  const handleLinkClick = useCallback(() => {
    close();
  }, [close]);

  return (
    <>
      <div ref={wrapperRef} data-menu-toggle-mount>
        <Hamburger
          toggled={open}
          toggle={setOpen}
          size={22}
          duration={0.3}
          distance="sm"
          color="currentColor"
          label={open ? "Cerrar menú" : "Abrir menú"}
          hideOutline={false}
          rounded
        />
      </div>
      <nav
        ref={navRef}
        id="mobile-menu"
        className="mobile-menu"
        aria-label="Navegación móvil"
        hidden={!open}
      >
        <div className="container-page">
          {links.map((link) => (
            <a
              key={link.href}
              className="nav-link"
              href={link.href}
              onClick={handleLinkClick}
            >
              {link.label}
            </a>
          ))}
          <a
            className="button-primary"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            data-event="click_cta_mobile"
            onClick={handleLinkClick}
          >
            Hablemos <Icon name="arrow-up-right" size={16} className="ui-icon ui-icon--end" />
          </a>
        </div>
      </nav>
    </>
  );
}