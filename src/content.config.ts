import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const noticias = defineCollection({
	loader: glob({ base: "./src/content/noticias", pattern: "**/*.md" }),
	schema: z.object({
		titulo: z.string(),
		fecha: z.coerce.date(),
		resumen: z.string(),
		imagen: z.string().optional(),
		autor: z.string().optional(),
		destacado: z.boolean().default(false),
	}),
});

export const collections = { noticias };
