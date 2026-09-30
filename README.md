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
