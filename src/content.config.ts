import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

/**
 * Cases are evidence, not a portfolio gallery. The schema is intentionally
 * strict: a missing problem, intervention or outcome must fail the build rather
 * than render an empty section.
 */
const cases = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/cases" }),
  schema: ({ image }) =>
    z.object({
      /** Short display name, e.g. "La Terraza". */
      name: z.string(),
      /** Editorial headline used on cards and the case hero. */
      title: z.string(),
      subtitle: z.string(),
      /** Client reference as documented. Use "No identificado" when unknown. */
      client: z.string(),
      sector: z.string(),
      /** One-line summary for cards, metadata and social previews. */
      summary: z.string(),

      featured: z.boolean(),
      order: z.number().int(),

      cover: image(),
      coverAlt: z.string(),
      /** Optional real-world photograph that sets the operational context. */
      contextImage: image().optional(),
      contextImageAlt: z.string().optional(),
      contextImageCaption: z.string().optional(),

      /** The three-block reading: problem → intervention → system. */
      problem: z.string(),
      intervention: z.string(),
      outcome: z.string(),

      /** Longer context paragraph for the case page. */
      context: z.string(),
      /** What the material does and does not prove. Never invent metrics. */
      scope: z.string(),
      flow: z.array(z.string()).default([]),

      stack: z.array(z.string()),
      duration: z.string(),
      status: z.string(),

      gallery: z
        .array(
          z.object({
            image: image(),
            alt: z.string(),
            caption: z.string(),
          }),
        )
        .default([]),
      links: z
        .array(
          z.object({
            href: z.url(),
            label: z.string(),
          }),
        )
        .default([]),
    }),
});

export const collections = { cases };
