# HiQNet — Design & UX Audit (2026-10-06)

Evidencia recogida con el harness `scripts/design-audit.mjs` sobre la web renderizada
antes del rediseño (screenshots y raw report en `docs/design-qa/before/`), análisis de
contraste WCAG computado sobre la paleta, y revisión de código.

## Resumen ejecutivo

La web funciona técnicamente, pero transmite "sitio generado": secciones idénticas en
ritmo y tamaño, mockups abstractos de UI falsa, copy repetitivo ("operación" aparece 4
veces en los headings), una página de ~12 000–15 000 px de alto y una experiencia de
scroll que oculta casi todo el contenido hasta que se entra en viewport.

## Visual

| Problema                                                                    | Evidencia                                                 | Prioridad |
| --------------------------------------------------------------------------- | --------------------------------------------------------- | --------- |
| Todos los H2 tienen el mismo tamaño (32→56 px)                              | `raw.json`: contexto=capacidades=enfoque=casos=ingenieria | P1        |
| El H2 de contacto usa el mismo tamaño que el H1 (44→96 px)                  | contacto:44/96 igual a inicio                             | P1        |
| Jerarquía H2/H3 débil                                                       | H3 en 18 px vs H2 32 px en móvil (1.8×, se siente igual)  | P2        |
| 3 bloques de Capabilities idénticos (icono+título+texto)                    | patrón "3 cards" (antipatrón AI)                          | P1        |
| Mockups abstractos de UI falsa (Hero, Web, Automate, Business, Engineering) | "interfaces falsas demasiado detalladas" (antipatrón AI)  | P1        |
| Numeración "01/…/06" en cada sección                                        | etiqueta decorativa sin función                           | P2        |
| Ritmo monótono: mismo padding + hairline en todas las secciones             | h²: contexto 665 px, capacidades 3797 px…                 | P1        |
| Página excesivamente larga                                                  | scrollHeight 390: 11 951 px / 1440: 14 786 px             | P1        |
| `above-fold images = 1` en 1440 (solo el logo del header)                   | el Hero no muestra trabajo real                           | P1        |

## UX

| Problema                                                  | Evidencia                                             | Prioridad |
| --------------------------------------------------------- | ----------------------------------------------------- | --------- |
| **CTA del hero fuera del primer pliegue en móvil**        | 390px: h1Bottom=348, ctaTop=857 (>844)                | **P0**    |
| 27/28 elementos `[data-reveal]` ocultos al cargar         | todo el contenido espera scroll para aparecer         | **P0**    |
| 4/4 imágenes lazy sin cargar en el primer pantallazo      | la sección de casos está vacía al hacer scroll rápido | P1        |
| Navegación con wording interno                            | "Capacidades", "Enfoque", "Ingeniería"                | P2        |
| Footer duplica la navegación                              | columna "Secciones"                                   | P2        |
| Hero oculto tras 978 px en móvil (visual antes del texto) | `order:-1` en el visual                               | P0        |

## Copy

| Problema                                                                  | Evidencia                                                                   |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| "operación" 4× en headings (H1, H2 contexto, H2 capacidades, H2 contacto) | scan-test de headings                                                       |
| Headings artificiales                                                     | "Cada operación pide una estructura", "Lo que se ve. Y lo que lo sostiene." |
| Mezcla ES/EN visible                                                      | eyebrow "Software en contexto", footer "Secciones", "Contacto"              |
| Títulos de capítulos de caso artificiales                                 | "La forma de trabajar.", "Cómo se relacionan las piezas."                   |
| Scan-test no cuenta la historia comercial                                 | los headings solos narran un concepto, no la oferta                         |

## Motion

| Problema                                                  | Evidencia                      | Prioridad       |
| --------------------------------------------------------- | ------------------------------ | --------------- |
| Reveal en ~28 elementos con stagger por párrafo           | todo entra en opacity 0→1      | P0 (percepción) |
| 3 visuales animados CSS + 1 escena GSAP (mockups)         | decoración pesada por sección  | P1              |
| Loops ambientales (señal hero, pulso Automate)            | movimiento sin comunicación    | P2              |
| GSAP no aporta narrativa: capas abstractas que se separan | escena decorativa, 116 KB lazy | P1              |

## Performance perception

| Problema                                                             | Evidencia                              |
| -------------------------------------------------------------------- | -------------------------------------- |
| React (132 KB raw, ~40 KB gzip) en el bundle base para un menú móvil | `client.DfMp84Gg.js`                   |
| GSAP+ScrollTrigger ~116 KB raw solo para la escena de Engineering    | chunk lazy                             |
| Fuentes: 3 familias (112 KB total)                                   | Space Grotesk + Inter + JetBrains Mono |
| LCP local rápido (92 ms) pero percepción lenta                       | reveals + lazy + JS pesado             |

## Contrast (WCAG AA computado)

| Par                                  | Ratio   | Verdict                                                                  |
| ------------------------------------ | ------- | ------------------------------------------------------------------------ |
| `--color-fg-subtle #6a7381` sobre bg | 4.09:1  | **FALLA** (<4.5) → axe: `color-contrast` serious (7 nodos home, 13 caso) |
| `--color-fg-muted #9aa4b2` sobre bg  | 7.76:1  | Pasa                                                                     |
| `--color-accent #2ad1f2` sobre bg    | 10.72:1 | Pasa                                                                     |

## Clasificación

- **P0**: CTA móvil fuera de pliegue; 27/28 reveals ocultan el contenido; hero móvil mal ordenado.
- **P1**: página demasiado larga; H2 uniformes; mockups de UI falsa; secciones iguales (cards/visuales); copy repetitivo y artificial; contraste de metadata; JS base innecesario (React+GSAP); lazy loading deja secciones vacías.
- **P2**: numeración decorativa; wording nav; footer duplicado; 3 familias tipográficas; títulos de capítulos de caso; loops ambientales.
