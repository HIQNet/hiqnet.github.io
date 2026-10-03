import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single registration entry point for GSAP + ScrollTrigger.
 *
 * The rest of the project must import `gsap` from this module so we never
 * call `gsap.registerPlugin(ScrollTrigger)` twice (which would log a warning
 * and double-initialize ScrollTrigger's internal state). Feature modules
 * (story-motion, capabilities-motion) register themselves against the same
 * context but own their own timelines/triggers for clean teardown.
 */
let registered = false;

export function getGsap(): typeof gsap {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return gsap;
}

export function getScrollTrigger(): typeof ScrollTrigger {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return ScrollTrigger;
}