import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://hiqnet.github.io",
  output: "static",
  build: {
    format: "file",
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});