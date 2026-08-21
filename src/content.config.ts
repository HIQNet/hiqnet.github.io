import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/projects",
    // Conserva el nombre exacto del archivo como id (ej. "about-laTerraza")
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({
    /** Nombre corto para el encabezado de la página de detalle */
    name: z.string(),
    /** Título usado en la tarjeta del portafolio */
    cardTitle: z.string(),
    /** Título principal dentro de la página de detalle */
    title: z.string(),
    /** Subtítulo de la página de detalle */
    subtitle: z.string(),
    /** Descripción corta para la tarjeta del portafolio */
    cardDescription: z.string(),
    /** Imagen de portada para la tarjeta */
    cover: z.string(),
    /** Párrafo(s) introductorios. Puede contener HTML inline (enlaces). */
    intro: z.string(),
    challenges: z.array(z.string()),
    solution: z.string(),
    results: z.array(z.string()),
    tech: z.array(z.string()),
    client: z.string(),
    duration: z.string(),
    status: z.string(),
    gallery: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string(),
        })
      )
      .default([]),
    links: z
      .array(
        z.object({
          href: z.url(),
          label: z.string(),
          icon: z.string(),
        })
      )
      .default([]),
    /** Orden de navegación entre proyectos (1 = primero) */
    order: z.number().int(),
  }),
});

export const collections = { projects };
