# HiQNet

Sitio corporativo de [HiQNet](https://hiqnet.github.io): carta de presentación comercial de una
empresa que diseña, construye e integra software para empresas y PyMEs.

Identidad visual: **dark editorial technology** — superficies oscuras, tipografía editorial,
evidencia real (capturas y fotos de proyectos), y un único acento de señal (cyan eléctrico).

---

## Stack

| Capa            | Elección                                                              |
| --------------- | --------------------------------------------------------------------- |
| Framework       | [Astro](https://astro.build) (static output, GitHub Pages)            |
| Lenguaje        | TypeScript estricto (`strict`, `noUncheckedIndexedAccess`)            |
| Package manager | pnpm                                                                  |
| Estilos         | Tailwind CSS 4 (tokens vía `@theme`) + CSS custom properties          |
| Iconos          | Lucide (catálogo curado y tree-shakeable)                             |
| Interactividad  | Vanilla TS (menú móvil con gestión de foco), sin librerías de runtime |
| Motion          | CSS / Web Animations únicamente (micro + entradas de cabeceras)       |
| Contenido       | Astro Content Collections + Zod                                       |
| QA              | Playwright (Chromium + WebKit), regresión visual por screenshots, axe |
| Imágenes        | Astro Assets (`astro:assets` + sharp)                                 |

Notas deliberadas:

- **Sin React ni GSAP.** Tras la auditoría (ver `docs/design-qa/audit.md`), el único uso de React
  era el menú móvil (132 KB de JS base por página) y el único uso de GSAP era una escena
  decorativa en Ingeniería (~116 KB lazy). Ambos se sustituyeron por CSS/vanilla: menos JS,
  contenido visible antes, mismo comportamiento accesible.
- **Dos familias tipográficas** self-hosted (Space Grotesk + Inter), solo subset `latin`.
- La segunda fuente de la identidad anterior (JetBrains Mono) se eliminó: las etiquetas usan
  Space Grotesk en caps.

## Scripts

```bash
pnpm dev            # servidor de desarrollo
pnpm build          # astro check + astro build (genera dist/)
pnpm preview        # sirve dist/
pnpm check          # astro check (typecheck + diagnostics)
pnpm lint           # prettier --check
pnpm format         # prettier --write
pnpm test           # Playwright (Chromium + WebKit) contra dist/
pnpm test:update    # regenera los baselines de regresión visual
node scripts/check-dist.mjs       # checks HTTP sobre dist/ (status, sitemap, redirects)
node scripts/design-audit.mjs before|after  # auditoría cuantitativa (screenshots + raw.json)
node scripts/generate-assets.mjs  # regenera public/og.png + favicons desde src/assets/brand
```

`pnpm test` espera que `dist/` esté construido (`pnpm build` primero).

## Arquitectura

```text
src/
├── assets/
│   ├── brand/              # logotipo, marca, imágenes de marca
│   └── cases/              # capturas reales por caso (materia prima de contenido)
├── components/
│   ├── core/               # primitivas: Button, TextLink, Eyebrow, Section, Reveal, ResponsiveImage
│   ├── navigation/         # Header, Footer, menú móvil (vanilla + CSS)
│   ├── home/               # Hero, Services, Approach, Work, Engineering, ContactCta
│   └── ui/                 # Icon (Lucide), WhatsAppIcon (path oficial)
├── config/                 # site.ts, contact.ts, navigation.ts — datos centralizados
├── content/cases/          # casos reales en markdown (schema estricto)
├── data/home.ts            # copy y estructura editorial del home (comercial, no técnico)
├── layouts/                # BaseLayout (SEO/OG/JSON-LD), CaseLayout (página de caso)
├── lib/
│   ├── motion/             # reveal (selectivo) + estado del header (vanilla)
│   ├── ui/                 # menú móvil (vanilla: foco, Esc, body lock)
│   └── utils/              # catálogo de iconos, paths de marca
├── pages/
│   ├── index.astro
│   ├── casos/[slug].astro
│   └── 404.astro
└── styles/                 # tokens.css → typography.css → global.css (+ fonts.css)
```

Principios técnicos:

- Páginas 100 % estáticas; el único módulo JS cargado es pequeño (header, reveal, menú móvil).
- Motion de micro y de sección es CSS puro. Sin GSAP, sin ScrollTrigger, sin loops ambientales.
- Los reveals son **selectivos**: solo cabeceras de sección (8–10 elementos), nunca por párrafo.
- Con `prefers-reduced-motion: reduce` las transiciones colapsan y el scroll es inmediato.
- Sin JavaScript la página es legible y navegable (fallback `noscript` en el header).

## Contenido

Los casos viven en `src/content/cases/*.md`; el schema (`src/content.config.ts`) es estricto:
falta de `problem`, `intervention` o `outcome` rompe el build. El cuerpo markdown se renderiza
como la sección "Cómo se construyó".

Política de contenido: los casos son **evidencia**, no portfolio; `scope` documenta qué prueba
el material y qué no. No se inventan métricas, clientes ni testimonios.

## Diseño

- **Tokens** en `src/styles/tokens.css`: un único accent (cyan `#2ad1f2`), superficies carbón,
  escala tipográfica, radii contenidos, motion, z-index. Sin valores sueltos en componentes.
- **Grid**: 12 columnas desktop, container 78rem, gutters con `clamp()`.
- **Tipografía**: Space Grotesk (display, headings, labels) + Inter (cuerpo).
- Público y dossier de la dirección: `docs/design-qa/{audit,direction}.md`.

## QA

- `tests/e2e/` — funcionalidad (home, nav, casos, 404, redirects legacy), accesibilidad
  (reduced motion, no-JS, skip link, foco del menú), consola sin errores.
- `tests/e2e/visual.spec.ts` — baselines de regresión visual
  (`tests/e2e/visual.spec.ts-snapshots/`) en Chromium y WebKit. Regenerar con `pnpm test:update`.
- `docs/design-qa/` — auditorías antes/después (screenshots y `raw.json`) con
  `node scripts/design-audit.mjs`.

## Deploy

GitHub Pages. El workflow `.github/workflows/deploy.yml` construye con `pnpm build` (Node 22,
pnpm) y publica `dist/`. Las URLs antiguas (`/proyectos/*.html`) redirigen via `meta refresh`
a las nuevas (`/casos/*/`).

## Notas

- Sin analytics instalados. Si se añade alguno, preferir Umami o Plausible.
- Sin credenciales ni secretos en el repositorio.
- La implementación anterior (pre-rebuild y pre-auditoría) queda archivada en la rama local
  `archive/pre-rebuild` y su tag, sin push.
