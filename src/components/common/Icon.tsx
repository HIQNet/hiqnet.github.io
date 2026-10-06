// React-side companion to ./Icon.astro: mirrors the same SVG geometry but
// stays inside the React island (e.g. MobileNav) so we avoid pulling in
// `lucide-react` just for one icon embedded in a client component.
//
// Keeps `currentColor` so styling still flows from the parent. Visual
// output is byte-identical to the Astro renderer for the same props.

import { icons, type IconName } from "../../icons/lucide";

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
}

export default function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.75,
  "aria-hidden": ariaHidden = "true",
  "aria-label": ariaLabel,
}: Props) {
  const definition = icons[name];
  if (!definition) {
    throw new Error(`Lucide icon "${name}" is not registered in src/icons/lucide.ts`);
  }
  const a11y =
    ariaHidden === false || ariaHidden === "false"
      ? { role: "img" as const, "aria-label": ariaLabel ?? name }
      : { "aria-hidden": "true" as const, focusable: false as const };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${definition.size} ${definition.size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: definition.inner }}
      {...a11y}
    />
  );
}