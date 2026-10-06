import { initHeader } from "./header";
import { initReveal } from "./reveal";

function boot(): void {
  initHeader();
  initReveal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
