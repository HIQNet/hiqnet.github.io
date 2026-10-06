# HiQNet — Design QA, Dirección 2

La revisión inicial que sigue documenta la primera implementación de la Dirección 2. El ajuste vigente de imágenes, paquetes y casos se registra al final.

## Objetivo y evidencia

- Imagen aprobada: `C:\Users\gaelg\.codex\generated_images\01a112bb-54bf-7f13-a5d2-02cc579ab826\exec-f2885865-4b65-4d08-8dee-405388c6c9c6.png` (1003 × 1568).
- Implementación: `docs/design-qa/faithful-implementation/home-1440.png` (1440 × 2323).
- Comparación lado a lado: `docs/design-qa/faithful-implementation/comparison-1440.png` (1440 × 1162). Ambas páginas se normalizaron a 720 px de ancho por columna; la implementación ocupa 36 px más de alto en esa escala.
- Estado: inicio de la página, tema oscuro, escritorio a 1440 px. Se revisó la página completa y, dentro de la misma comparación, las regiones de portada, servicios y casos. No se necesitó otro recorte: el arte combinado permite ver las tres regiones y sus separaciones sin perder contexto.
- Capturas adicionales a 390, 430, 768, 1024, 1280 y 1920 px, más datos crudos, en `docs/design-qa/faithful-implementation/`.

## Iteraciones y hallazgos

| Prioridad | Hallazgo                                                                                                                                                                                             | Resolución                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1        | La primera implementación editorial (`docs/design-qa/editorial-implementation/`) era demasiado larga y usaba filas narrativas; no reproducía la composición de la imagen elegida.                    | Se rehizo la portada con hero de texto y portátil, visión de tres pasos, servicios en tres columnas, dos casos asimétricos, CTA y pie compactos.    |
| P2        | El espaciado global de secciones y las imágenes de componentes Astro no seguían los estilos locales; los casos quedaban demasiado separados y algunas capturas salían sin imagen por carga diferida. | Se corrigió el alcance de los estilos y se decodifican las imágenes antes de la captura de auditoría.                                               |
| P2        | Las pruebas de accesibilidad aún buscaban el titular y la estructura de la versión anterior.                                                                                                         | Se actualizaron las expectativas a la portada vigente; se conservan las pruebas de contenido sin JavaScript, movimiento reducido y foco de teclado. |

## Resultado visual

| Aspecto                   | Revisión                                                                                                                                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composición y ritmo       | Coinciden la secuencia, las proporciones generales y la alternancia de texto y producto de la imagen. A escala normalizada la diferencia total de altura es aproximadamente 3 %.                                            |
| Tipografía y color        | Se preservan el titular grande de tres líneas, la jerarquía de etiquetas pequeñas, el fondo casi negro, texto blanco y una señal cian.                                                                                      |
| Imágenes                  | Portada y primer caso muestran La Terraza sobre un portátil; Web y el segundo caso muestran un trabajo real de Servicios Web Icono. Automate usa una ilustración conceptual, identificada como tal en su texto alternativo. |
| Contenido y coherencia    | La estructura reproduce la referencia sin inventar resultados, métricas ni testimonios. Los textos y enlaces explican servicios y casos reales de HiQNet; los demás casos siguen accesibles mediante “Todos los casos”.     |
| Diferencias intencionales | Las fotografías y pantallas no son idénticas a los píxeles generados: se adaptaron a evidencias y proyectos reales de HiQNet. Las páginas interiores de casos conservan su desarrollo narrativo completo.                   |

## Validación

- Auditoría a siete anchos entre 390 y 1920 px: sin desbordamiento horizontal; sin contenido oculto por animaciones de aparición. En 390 px el titular y CTA principal entran en el primer pliegue.
- axe: cero infracciones detectadas en portada y página de caso auditada. Esto no sustituye una evaluación manual completa de accesibilidad.
- Pruebas funcionales: 49 aprobadas y una omitida por diferencia conocida de orden de foco en WebKit, en Chromium y WebKit. Incluyen enlaces, navegación móvil, casos, lectura sin JavaScript, movimiento reducido y ausencia de errores de consola.
- En esta primera revisión no se actualizaron las capturas base de regresión de la dirección anterior.

## Resultado final: passed

La portada implementada corresponde a la Dirección 2 aprobada, conserva el sentido y los casos de HiQNet y no presenta desvíos visuales P0, P1 o P2 abiertos. No se publicó ni desplegó.

## Ajuste vigente: software, paquetes y casos

- Portada revisada a 390 y 1440 px: `docs/design-qa/software-only/home-390.png` y `docs/design-qa/software-only/home-1440.png`.
- Las tres áreas Web, Automate y Business usan símbolos lineales propios de su función; no muestran fotografías ni escenas generadas.
- La portada y los dos casos destacados muestran capturas de las aplicaciones correspondientes. La cabecera y galería de La Terraza también usan solo capturas de su software; la galería se distribuye en pares de igual ancho y alto. Captura: `docs/design-qa/software-only/la-terraza-1440.png`.
- “Casos reales” tiene encabezado y separación visual propios; las acciones de las dos tarjetas destacadas quedan alineadas.
- Se añadieron pruebas funcionales para estos criterios y se renovaron las capturas de regresión visual de la composición actual. Se retiraron dos capturas antiguas de una sección que ya no aparece en la portada.
- `pnpm build` y `pnpm lint` pasan. La primera ejecución de la suite completa confirmó 57 pruebas funcionales aprobadas, una omitida conocida y 22 comparaciones visuales desactualizadas. Tras renovar las capturas, la suite completa pasa con 77 pruebas aprobadas y una omitida conocida en Chromium y WebKit.

## Variantes de logo por contexto

- Variante horizontal `src/assets/brand/1.png`: barra superior y pie compacto del landing.
- Variante apilada `src/assets/brand/2.png`: pie amplio de los detalles de proyectos. El símbolo independiente `3.png` queda disponible para aplicaciones pequeñas; no se fuerza en estos componentes.
- Se revisaron los componentes a 320, 390, 768 y 1440 px. Las capturas de barra y pies están en `docs/design-qa/logo-variants/`.
- En móvil se oculta el botón de contacto redundante de la barra para que el logo no se comprima; la acción de contacto sigue en el menú. Las proporciones y la ausencia de desbordamiento quedan cubiertas por pruebas de navegador.
