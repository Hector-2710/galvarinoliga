/**
 * Configuración del Astro Content Layer.
 *
 * Define las colecciones de contenido del sitio, cargadas desde archivos Markdown
 * del directorio `src/content/`. Cada colección tiene un esquema Zod que valida
 * y tipa el frontmatter de los archivos.
 */

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Colección de noticias del sitio.
 *
 * Carga archivos Markdown desde `src/content/noticias/` y los expone como
 * una colección tipada accesible mediante `Astro.glob()` o la API de contenido.
 *
 * Esquema de frontmatter:
 * - `titulo` (requerido): Título de la noticia.
 * - `fecha` (requerido): Fecha de publicación. Se coerciona automáticamente a Date.
 * - `resumen` (requerido): Extracto o bajada de la noticia.
 * - `imagen` (opcional): Ruta o URL de la imagen destacada.
 * - `autor` (opcional): Nombre del autor. Si se omite, se muestra "Redacción".
 * - `destacado` (opcional, por defecto `false`): Marca la noticia como destacada
 *   para mostrarla en la portada o secciones especiales.
 */
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

/** Registro de todas las colecciones del sitio. Exportado para que Astro Content Layer las procese. */
export const collections = { noticias };
