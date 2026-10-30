/**
 * Configuración del Astro Content Layer.
 *
 * Define las colecciones de contenido del sitio, cargadas desde archivos Markdown
 * del directorio `src/content/`. Cada colección tiene un esquema Zod que valida
 * y tipa el frontmatter de los archivos en build.
 *
 * Colecciones:
 * - `equipos`: un archivo por club.
 * - `temporadas`: una por campeonato, con ajustes de puntos opcionales.
 * - `jornadas`: una por fecha, con el calendario y los resultados de sus partidos.
 * - `goles`: un archivo por temporada con todos los goles (jugador, club y partido).
 */

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Acepta fechas escritas como `"2026-04-05"` o como fecha YAML sin comillas,
 * normalizándolas siempre a `YYYY-MM-DD`.
 */
const fecha = z
	.union([z.string(), z.date()])
	.transform((valor) => (valor instanceof Date ? valor.toISOString().slice(0, 10) : valor));

/** Identificador de archivo usado como referencia entre colecciones. */
const slug = z
	.string()
	.min(1)
	.regex(/^[a-z0-9-]+$/, 'Debe ser un slug en minúsculas (letras, números y guiones)');

const equipos = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/equipos' }),
	schema: z.object({
		nombre: z.string().min(1),
		nombre_corto: z.string().optional(),
		ano_creacion: z.number().int().optional(),
		logo: z.string().optional(),
		color_principal: z.string().default('#E61E2A'),
		presidente: z.string().optional(),
		secretaria: z.string().optional(),
		tesorera: z.string().optional(),
	}),
});

const temporadas = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/temporadas' }),
	schema: z.object({
		nombre: z.string().min(1),
		anio: z.number().int(),
		activa: z.boolean().default(false),
		fecha_inicio: fecha,
		fecha_fin: fecha,
		ajustes: z
			.array(
				z.object({
					equipo: slug,
					puntos: z.number().int(),
					motivo: z.string().optional(),
				}),
			)
			.default([]),
	}),
});

const partido = z.object({
	slug: slug,
	fecha: fecha,
	hora: z.string().min(1),
	cancha: z.string().min(1),
	equipo1: slug,
	equipo2: slug,
	goles1: z.number().int().min(0).nullable().default(null),
	goles2: z.number().int().min(0).nullable().default(null),
	estado: z.enum(['programado', 'finalizado']),
});

const jornadas = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/jornadas' }),
	schema: z.object({
		temporada: slug,
		numero: z.number().int().positive(),
		nombre: z.string().min(1),
		fecha_inicio: fecha,
		fecha_fin: fecha,
		partidos: z.array(partido),
	}),
});

const goles = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/goles' }),
	schema: z.object({
		temporada: slug,
		goles: z.array(
			z.object({
				jugador: z.string().min(1),
				equipo: slug,
				partido: slug,
			}),
		),
	}),
});

export const collections = { equipos, temporadas, jornadas, goles };
