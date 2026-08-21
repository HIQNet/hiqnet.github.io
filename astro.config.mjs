import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://hiqnet.github.io",
  output: "static",
  build: {
    format: "file",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
