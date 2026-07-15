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

/** Registro de todas las colecciones del sitio. Exportado para que Astro Content Layer las procese. */
export const collections = {};
