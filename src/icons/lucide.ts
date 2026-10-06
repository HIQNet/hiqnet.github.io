// Curated Lucide icons used across the site. Each entry mirrors the SVG node
// array exported by lucide-react so we can render the same SVG geometry from
// Astro without hydrating a React component per icon.
//
// Sources: lucide-react v1.50 (ISC). 24x24 viewBox, stroke-width 2,
// `stroke="currentColor"`, `fill="none"`, `stroke-linecap="round"`,
// `stroke-linejoin="round"`. Only the icons the site actually uses are kept
// here so the bundle stays minimal and tree-shaking friendly.

export interface IconDefinition {
  name: string;
  size: 24;
  /**
   * Inner SVG markup authored from Lucide's published node arrays.
   * Trust boundary: every entry is hand-pasted from the npm package, so it
   * is treated as build-time content (no user input).
   */
  inner: string;
}

export const icons = {
  "arrow-up-right": {
    name: "arrow-up-right",
    size: 24,
    inner: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  },
  "arrow-down": {
    name: "arrow-down",
    size: 24,
    inner: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  },
  "arrow-up": {
    name: "arrow-up",
    size: 24,
    inner: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  },
  "arrow-left": {
    name: "arrow-left",
    size: 24,
    inner: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  },
  "arrow-right": {
    name: "arrow-right",
    size: 24,
    inner: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  },
  mail: {
    name: "mail",
    size: 24,
    inner:
      '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>' +
      '<rect x="2" y="4" width="20" height="16" rx="2"/>',
  },
  x: {
    name: "x",
    size: 24,
    inner: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof icons;