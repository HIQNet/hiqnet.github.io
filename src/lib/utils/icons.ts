import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Database,
  Layers,
  Mail,
  Menu,
  Plug,
  ShieldCheck,
  X,
} from "lucide";

/**
 * Curated Lucide icon set. Importing individual icons keeps the bundle small
 * (tree-shaken) and fixes the vocabulary the UI is allowed to use.
 */
export const icons = {
  "arrow-down": ArrowDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  database: Database,
  layers: Layers,
  mail: Mail,
  menu: Menu,
  plug: Plug,
  "shield-check": ShieldCheck,
  x: X,
} as const;

export type IconName = keyof typeof icons;
