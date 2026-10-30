#!/usr/bin/env node
/**
 * Valida el contenido de `src/content/` antes del build.
 *
 * Reemplaza las restricciones que antes aplicaba PostgreSQL: referencias entre
 * archivos, partidos y clubes repetidos, y coherencia entre el marcador y los
 * goles registrados. Los errores cortan el build; los avisos solo se informan.
 *
 * Uso: pnpm validar
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const CONTENT = 'src/content';
const errores = [];
const avisos = [];

const error = (mensaje) => errores.push(mensaje);
const aviso = (mensaje) => avisos.push(mensaje);

/** Lee todos los .md de una colección y devuelve su frontmatter con el nombre del archivo. */
function leerColeccion(nombre) {
	const dir = join(CONTENT, nombre);
	if (!existsSync(dir)) {
		error(`falta el directorio ${dir}`);
		return [];
	}
	return readdirSync(dir)
		.filter((archivo) => archivo.endsWith('.md'))
		.map((archivo) => {
			const texto = readFileSync(join(dir, archivo), 'utf8');
			const match = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
			if (!match) {
				error(`${nombre}/${archivo}: no tiene frontmatter entre ---`);
				return null;
			}
			try {
				return { archivo: `${nombre}/${archivo}`, id: archivo.replace(/\.md$/, ''), data: parse(match[1]) ?? {} };
			} catch (e) {
				error(`${nombre}/${archivo}: YAML inválido (${e.message})`);
				return null;
			}
		})
		.filter(Boolean);
}

const equipos = leerColeccion('equipos');
const temporadas = leerColeccion('temporadas');
const jornadas = leerColeccion('jornadas');
const goles = leerColeccion('goles');

const equiposPorSlug = new Map(equipos.map((e) => [e.id, e]));

// --- Temporadas ---
const activas = temporadas.filter((t) => t.data.activa);
if (activas.length === 0) error('ninguna temporada tiene "activa: true"');
if (activas.length > 1) error(`hay ${activas.length} temporadas activas; debe haber solo una`);

for (const temporada of temporadas) {
	for (const ajuste of temporada.data.ajustes ?? []) {
		if (!equiposPorSlug.has(ajuste.equipo)) {
			error(`${temporada.archivo}: el ajuste apunta al club inexistente "${ajuste.equipo}"`);
		}
	}
}

const slugsTemporada = new Set(temporadas.map((t) => t.id));

// --- Jornadas y partidos ---
const partidosPorSlug = new Map();
const numerosPorTemporada = new Map();

for (const jornada of jornadas) {
	const { temporada, numero, partidos = [] } = jornada.data;

	if (!slugsTemporada.has(temporada)) {
		error(`${jornada.archivo}: la temporada "${temporada}" no existe`);
	}

	const clave = `${temporada}#${numero}`;
	if (numerosPorTemporada.has(clave)) {
		error(`${jornada.archivo}: la fecha ${numero} está repetida en la temporada "${temporada}"`);
	}
	numerosPorTemporada.set(clave, jornada.archivo);

	if (partidos.length === 0) aviso(`${jornada.archivo}: no tiene partidos`);

	for (const partido of partidos) {
		if (partidosPorSlug.has(partido.slug)) {
			error(`${jornada.archivo}: el slug de partido "${partido.slug}" ya existe en ${partidosPorSlug.get(partido.slug).archivo}`);
			continue;
		}
		partidosPorSlug.set(partido.slug, { ...partido, jornada, temporada });

		for (const lado of ['equipo1', 'equipo2']) {
			if (!equiposPorSlug.has(partido[lado])) {
				error(`${jornada.archivo}: el partido "${partido.slug}" tiene ${lado} "${partido[lado]}" que no existe`);
			}
		}
		if (partido.equipo1 === partido.equipo2) {
			error(`${jornada.archivo}: el partido "${partido.slug}" enfrenta al mismo club dos veces`);
		}
		if (partido.estado === 'finalizado' && (partido.goles1 === null || partido.goles2 === null)) {
			error(`${jornada.archivo}: el partido "${partido.slug}" está finalizado pero no tiene marcador`);
		}
	}
}

// --- Goles ---
const golesPorPartido = new Map();

for (const archivo of goles) {
	const { temporada, goles: lista = [] } = archivo.data;
	if (!slugsTemporada.has(temporada)) {
		error(`${archivo.archivo}: la temporada "${temporada}" no existe`);
	}

	for (const gol of lista) {
		const partido = partidosPorSlug.get(gol.partido);
		if (!partido) {
			error(`${archivo.archivo}: el gol de "${gol.jugador}" apunta al partido inexistente "${gol.partido}"`);
			continue;
		}
		if (!equiposPorSlug.has(gol.equipo)) {
			error(`${archivo.archivo}: el gol de "${gol.jugador}" apunta al club inexistente "${gol.equipo}"`);
			continue;
		}
		if (partido.equipo1 !== gol.equipo && partido.equipo2 !== gol.equipo) {
			error(
				`${archivo.archivo}: el gol de "${gol.jugador}" (${gol.equipo}) no juega el partido "${gol.partido}"`,
			);
		}
		if (partido.estado !== 'finalizado') {
			aviso(`${archivo.archivo}: hay un gol de "${gol.jugador}" en el partido "${gol.partido}", que no está finalizado`);
		}
		const clave = `${gol.partido}|${gol.equipo}`;
		golesPorPartido.set(clave, (golesPorPartido.get(clave) ?? 0) + 1);
	}
}

for (const [slug, partido] of partidosPorSlug) {
	if (partido.estado !== 'finalizado') continue;
	for (const [, equipo, marcador] of [
		['equipo1', partido.equipo1, partido.goles1],
		['equipo2', partido.equipo2, partido.goles2],
	]) {
		if (marcador === null || marcador === undefined) continue;
		const registrados = golesPorPartido.get(`${slug}|${equipo}`) ?? 0;
		if (registrados !== marcador) {
			aviso(
				`${partido.jornada.archivo}: "${slug}" tiene marcador ${marcador} para ${equipo} pero ${registrados} gol(es) registrados`,
			);
		}
	}
}

// --- Nombres de goleadores parecidos ---
const normalizar = (texto) =>
	texto
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();

function distancia(a, b) {
	const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		let anterior = fila[0];
		fila[0] = i;
		for (let j = 1; j <= b.length; j++) {
			const temp = fila[j];
			fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
			anterior = temp;
		}
	}
	return fila[b.length];
}

const nombresPorEquipo = new Map();
for (const archivo of goles) {
	for (const gol of archivo.data.goles ?? []) {
		const lista = nombresPorEquipo.get(gol.equipo) ?? new Map();
		lista.set(normalizar(gol.jugador), gol.jugador);
		nombresPorEquipo.set(gol.equipo, lista);
	}
}

for (const [equipo, nombres] of nombresPorEquipo) {
	const lista = [...nombres.entries()];
	for (let i = 0; i < lista.length; i++) {
		for (let j = i + 1; j < lista.length; j++) {
			const [a, b] = [lista[i][0], lista[j][0]];
			if (distancia(a, b) <= 2) {
				aviso(`goleadores de ${equipo}: "${lista[i][1]}" y "${lista[j][1]}" podrían ser el mismo jugador`);
			}
		}
	}
}

// --- Resultado ---
for (const avisoTexto of avisos) console.warn(`aviso  ${avisoTexto}`);
for (const errorTexto of errores) console.error(`error  ${errorTexto}`);

const resumen = `${equipos.length} clubes, ${temporadas.length} temporada(s), ${jornadas.length} fechas, ${partidosPorSlug.size} partidos`;
if (errores.length > 0) {
	console.error(`\nContenido inválido: ${errores.length} error(es), ${avisos.length} aviso(s). ${resumen}.`);
	process.exit(1);
}
console.log(`Contenido válido: ${avisos.length} aviso(s). ${resumen}.`);
