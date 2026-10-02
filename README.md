# HiQNet Astro

## Desarrollo

Requiere Node.js compatible con Astro y Corepack.

```bash
corepack enable
pnpm install
pnpm dev
```

## Verificación

```bash
pnpm run build
pnpm preview
```

El proyecto usa `pnpm-lock.yaml` y declara `pnpm@11.10.0` en `package.json`. No se debe regenerar la instalación con npm ni añadir un `package-lock.json`.

## QA del rediseño

El QA usa el `playwright` ya declarado en el proyecto, sin dependencias nuevas.
Requiere Node.js >=22.12, pnpm 11.10.0 y el Chromium de esa versión de Playwright.
En una instalación nueva, descargarlo con `pnpm exec playwright install chromium`
(en CI Linux, `pnpm exec playwright install --with-deps chromium`). Esta instalación
requiere red y escribe en la caché de navegadores; no forma parte del runner.

**Durante la preparación del rediseño, esperar la autorización del responsable antes
de construir o validar el diseño.** Una vez autorizado, desde la raíz:

```sh
pnpm run build
node scripts/qa/run.mjs
```

`run.mjs` no construye ni instala nada. Exige los seis HTML de `dist/` y rechaza un
build anterior a `src/`, `public/` o la configuración/dependencias del proyecto.
La comprobación de frescura usa fechas de modificación: no demuestra procedencia
ni detecta todos los cambios con timestamps preservados. Construir inmediatamente
antes de QA sigue siendo necesario.

El runner importa la configuración y usa `preview()` de Astro con `configFile:false`,
loopback `127.0.0.1` y puerto efímero. Comprueba disponibilidad HTTP, ejecuta el smoke
y cierra Chromium y el preview tanto al terminar como ante un fallo. No usa un
servidor permanente, un proceso en background ni un puerto fijo, y no detiene otros
servidores. Desactiva telemetría de Astro. Tiene un límite global de 240 segundos,
10 segundos por acción/condición y hasta 10 segundos adicionales para cancelar y
cerrar. Devuelve código distinto de cero al fallar; timeout: 124, SIGINT: 130,
SIGTERM: 143. Los errores identifican escenario, ruta y viewport.

### Configuración en Windows con shell `sh`

Las variables se asignan con sintaxis POSIX, no con sintaxis de PowerShell:

```sh
HIQNET_QA_WIDTHS=375,390,768,1024,1280,1440 HIQNET_QA_TIMEOUT_MS=300000 node scripts/qa/run.mjs
HIQNET_QA_SCREENSHOTS=1 node scripts/qa/run.mjs
```

- `HIQNET_QA_WIDTHS`: anchos de home; por defecto `375,390,768,1024,1280,1440`.
  Solo acepta enteros positivos hasta 7680. Los cinco proyectos siempre se prueban
  a 390 y 1280 px; también se mantienen ambos anchos para fallbacks y movimiento.
- `HIQNET_QA_TIMEOUT_MS`: límite global en milisegundos, por defecto `240000`.
- `HIQNET_QA_SCREENSHOTS=1`: crea capturas en `.superpowers/qa-rebuild/`; sin esta
  opción no escribe capturas. Incluye hero y página completa de home en cada ancho,
  cada proyecto a 390/1280 y cuatro posiciones de la story. Los nombres se reutilizan
  en ejecuciones posteriores; son evidencia para revisión, no un comparador de píxeles.
- `HIQNET_BASE_URL`: solo para ejecutar el smoke directamente contra un servidor
  que ya esté supervisado. El runner ignora esta variable y usa su propio preview.

```sh
HIQNET_BASE_URL=http://127.0.0.1:4321 node scripts/qa/hiqnet-smoke.mjs
```

El smoke directo cierra su navegador, pero no gestiona el servidor externo.
`node scripts/qa/run.mjs --help` y `node scripts/qa/hiqnet-smoke.mjs --help` muestran
las opciones sin construir, iniciar preview ni lanzar el navegador.

### Cobertura y contrato

- Home y cinco rutas `.html`, preservando mayúsculas; overflow horizontal durante
  el recorrido, carga/decodificación de todas las imágenes tras scroll real,
  errores JavaScript, consola, recursos HTTP y peticiones fallidas.
- Un H1, títulos únicos, descripción, canonical de producción, Open Graph, Twitter,
  JSON-LD de la empresa, imágenes sociales, sitemap, robots y enlaces locales con
  sus fragmentos. Los enlaces de producción locales se verifican contra el preview;
  no se visitan enlaces de terceros ni se envían mensajes/formularios.
- Menú nonmodal `#menu-toggle` / `#mobile-menu`: `hidden`, `aria-controls`,
  `aria-expanded`, Escape y restauración de foco, Tab/Shift+Tab con el botón dentro
  del ciclo, cierre por clic exterior/enlace y resize móvil → escritorio → móvil.
  No exige la antigua clase `menu-open` ni textos de secciones en mayúsculas.
- Contenido significativo de las seis páginas sin JavaScript y con los bundles
  locales bloqueados, comparado con la misma ruta/ancho con JS. Solo se excluyen los
  errores de red esperados de esos bundles; otros errores siguen fallando el QA.
- Reduced motion inicial y cambios de preferencia en runtime, visibilidad de todas
  las `.reveal` antes de scroll y story sin sticky/fixed en móvil o modo reducido.
  La story conserva `[data-story-section]`, `[data-story-visual]`, cuatro
  `[data-story-step]` y los valores numéricos 0–1 `--connection`, `--flow`, `--system`.
  Su progreso por scroll solo se activa en escritorio (>=1024 px) sin reduced motion.

Se usan esperas por condiciones, carga de recursos y frames, no `networkidle` ni
pausas fijas para dar por cargadas las imágenes. Las capturas se toman después del
recorrido, con animaciones CSS desactivadas solo para capturar; no se fuerzan clases
de visibilidad ni variables de la story para hacer pasar las pruebas.

**Límites:** Chromium de escritorio con viewport emulado, no dispositivos reales ni
Firefox/WebKit. No es Lighthouse, no calcula una puntuación de rendimiento ni impone
presupuestos LCP/CLS/INP. Tampoco certifica WCAG, contraste, lectores de pantalla,
indexación pública ni resultados enriquecidos. Requiere revisión visual humana y
mediciones de rendimiento separadas; que el smoke pase no aprueba por sí solo el diseño.

## Analítica de conversión

No se instala analítica de terceros por defecto. Los elementos de conversión emiten
un evento `hiqnet:conversion` en `window`, con `{ name }` como detalle (por ejemplo,
`click_whatsapp`, `click_email` o `view_project`). La integración con Plausible,
Umami o Google Analytics debe escuchar ese evento y aplicar su propio aviso de
privacidad/consentimiento cuando corresponda.

## Seguridad y GitHub Pages

El sitio no contiene secretos ni un backend de formularios. GitHub Pages sirve el
sitio estático, pero no permite definir de manera confiable encabezados como CSP,
HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` o
`frame-ancestors` desde este repositorio. Para establecerlos se requiere un CDN,
proxy inverso o hosting que permita gestionar encabezados (por ejemplo, Cloudflare).

Antes de desplegar una integración de formularios o analítica se debe revisar el
aviso de privacidad y el tratamiento de los datos personales.
