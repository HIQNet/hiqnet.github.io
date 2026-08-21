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
