export interface NavItem {
  label: string;
  /** In-page anchor id (without the `#`). */
  id: string;
}

/** Primary navigation. Short, natural words; the CTA carries the action. */
export const navItems: readonly NavItem[] = [
  { label: "Qué hacemos", id: "servicios" },
  { label: "Cómo trabajamos", id: "enfoque" },
  { label: "Casos", id: "casos" },
  { label: "Contacto", id: "contacto" },
] as const;

export const contactAnchorId = "contacto";
