import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// Static output for GitHub Pages. `site` drives canonical URLs, sitemap and OG.
// No React islands remain: the mobile menu is a small vanilla module.
export default defineConfig({
  site: "https://hiqnet.github.io",
  output: "static",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
