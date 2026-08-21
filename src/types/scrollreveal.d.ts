declare module "scrollreveal" {
  interface RevealOptions {
    delay?: number;
    distance?: string;
    duration?: number;
    origin?: "top" | "right" | "bottom" | "left";
    interval?: number;
  }

  interface ScrollRevealInstance {
    reveal(target: string, options?: RevealOptions): void;
  }

  export default function ScrollReveal(): ScrollRevealInstance;
}
