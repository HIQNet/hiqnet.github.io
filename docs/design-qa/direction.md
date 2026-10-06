# HiQNet — Art Direction post-audit (2026-10-06)

## Dirección elegida: Refined Dark Editorial Technology

Una carta de presentación de empresa tecnológica: oscura, precisa, con aire y con
**evidencia real** (screenshots y fotografías de proyectos) en lugar de ilustraciones
abstractas. La tipografía editorial manda; el acento único (cyan) solo marca lo
importante; el motion es corto y selectivo.

### Principios

1. **Mensaje primero.** El Hero debe responder en 5 segundos qué hace HiQNet y cómo
   contactarla. Nada compite con el headline y el CTA.
2. **Evidencia real.** Sustituir los mockups de UI falsa por screenshots/fotos reales de
   los casos, con caption editorial. Una pantalla real vale más que diez gráficos.
3. **Un solo acento.** Cyan como única señal interactiva. Se elimina el índigo de la UI
   (el logotipo ya aporta el matiz azul-violeta de marca).
4. **Menos, mejor.** Home de ~6–7 pantallas en vez de 15 000 px. Secciones con
   funciones visuales distintas, no solapadas.
5. **Rápido de sentir.** Contenido visible al cargar: reveals solo en cabeceras de
   sección (máximo 8–10 elementos), hero sin secuencia de entrada, sin loops ambientales.

## Paleta refinada

| Token                      | Valor                         | Nota                                |
| -------------------------- | ----------------------------- | ----------------------------------- |
| `bg`                       | `#0a0c0f`                     | carbón (mantiene)                   |
| `bg-deep`                  | `#07090b`                     | sección intermedia de contraste     |
| `surface / raised / inset` | `#0f1217 / #151922 / #0c0f13` | mantiene                            |
| `fg`                       | `#eceef2`                     | blanco roto (mantiene)              |
| `fg-muted`                 | `#a5afbd`                     | sube (8.6:1)                        |
| `fg-subtle`                | `#7d8594`                     | sube para cumplir AA (5.2:1)        |
| `line / soft / strong`     | `#232b35 / #191f27 / #3a4550` | strong sube para estructura visible |
| `accent`                   | `#2ad1f2`                     | única señal (mantiene)              |
| `accent-2`                 | —                             | **eliminado** de la UI              |
| `focus`                    | `#58dcf5`                     | mantiene                            |

## Tipografía

Dos familias (se elimina JetBrains Mono; las etiquetas usan Space Grotesk caps).

| Rol           | Escala                                         | Notas                   |
| ------------- | ---------------------------------------------- | ----------------------- |
| display (H1)  | `clamp(2.5rem, 6.5vw, 5rem)`, lh 1.02, -0.03em | más contenida que antes |
| headline (H2) | `clamp(1.75rem, 3.6vw, 2.875rem)`, lh 1.06     |                         |
| title (H3)    | `clamp(1.25rem, 1.8vw, 1.625rem)`, lh 1.2      |                         |
| lead          | `clamp(1.0625rem, 1.1vw, 1.1875rem)`, lh 1.6   |                         |
| body / small  | 1rem lh 1.65 / 0.875rem                        |                         |
| label         | 0.75rem, caps, tracking 0.14em                 | sans el mono            |

Space Grotesk para display, headings, labels y números; Inter para cuerpo y UI.

## Motion

- **Micro** 140 ms / **fast** 200 ms / **section** 480 ms.
- Reveal únicamente en cabeceras de sección (sin stagger por elemento).
- Sin GSAP, sin ScrollTrigger, sin loops: libres de jank y de 116 KB de JS lazy.
- Reduced motion y no-JS conservados como requisito de arquitectura.

## Information architecture

Nav: **Qué hacemos · Cómo trabajamos · Casos · Contacto.**

1. Hero (mensaje + CTA + evidencia real en un plato editorial)
2. Qué hacemos `#servicios` (reconocimiento del problema + 3 capacidades en lista editorial)
3. Cómo trabajamos `#enfoque` (4 pasos, compacto)
4. Casos `#casos` (evidencia real, más corta)
5. Cómo lo construimos `#ingenieria` (capacidad técnica, sin diagramas ni stack-vanity)
6. Contacto `#contacto` (WhatsApp + correo)

Footer simplificado: marca, byline, contacto y redes (sin duplicar navegación).

## Guías de composición

- 12 columnas desktop, container 78rem; secciones con ritmo diferenciado (bg alterno,
  hemeroteca tipográfica, galería de capturas), no solo padding.
- Cero "3 cards" iguales: capabilities como listas editoriales con reglas.
- Ceros mockups UI: delante, capturas reales con marco fino y caption mono.
- Metadata corta en AA (fg-subtle 5.2:1, 0.75rem+).
