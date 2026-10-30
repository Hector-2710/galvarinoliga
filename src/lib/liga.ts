/**
 * Capa de datos del campeonato.
 *
 * Lee las colecciones de Markdown (`src/content/`) y calcula en build todo lo
 * que antes resolvía la base de datos: tabla de posiciones, goleadores y
 * próximos partidos. No hay consultas en runtime: el sitio se genera estático.
 */

import { getCollection } from 'astro:content';

export interface Equipo {
	slug: string;
	nombre: string;
	nombre_corto?: string;
	ano_creacion?: number;
	logo?: string;
	color_principal: string;
	presidente?: string;
	secretaria?: string;
	tesorera?: string;
}

export interface JornadaRef {
	numero: number;
	nombre: string;
}

export interface Partido {
	slug: string;
	temporada: string;
	jornada: JornadaRef;
	fecha: string;
	hora: string;
	cancha: string;
	equipo1: Equipo;
	equipo2: Equipo;
	goles1: number | null;
	goles2: number | null;
	estado: 'programado' | 'finalizado';
}

export interface Jornada {
	temporada: string;
	numero: number;
	nombre: string;
	fecha_inicio: string;
	fecha_fin: string;
	partidos: Partido[];
}

export interface Gol {
	jugador: string;
	equipo: Equipo;
	partido: Partido;
}

export interface Goleador {
	jugador: string;
	equipo: Equipo;
	goles: number;
}

export interface FilaTabla {
	pos: number;
	equipo: Equipo;
	pj: number;
	g: number;
	e: number;
	p: number;
	gf: number;
	gc: number;
	dg: number;
	pts: number;
	ajuste: number;
}

export interface Temporada {
	slug: string;
	nombre: string;
	anio: number;
	activa: boolean;
	fecha_inicio: string;
	fecha_fin: string;
	ajustes: { equipo: string; puntos: number; motivo?: string }[];
}

/** Normaliza nombres para agrupar goleadores sin depender de tildes ni mayúsculas. */
export function normalizarNombre(nombre: string): string {
	return nombre
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();
}

/** Error de contenido con la ruta del archivo que debe corregirse. */
function errorContenido(mensaje: string): never {
	throw new Error(`Contenido inválido: ${mensaje}`);
}

interface Dataset {
	equipos: Equipo[];
	temporada: Temporada;
	jornadas: Jornada[];
	partidos: Partido[];
	goles: Gol[];
}

async function cargar(): Promise<Dataset> {
	const [equiposEntries, temporadasEntries, jornadasEntries, golesEntries] = await Promise.all([
		getCollection('equipos'),
		getCollection('temporadas'),
		getCollection('jornadas'),
		getCollection('goles'),
	]);

	const equipos: Equipo[] = equiposEntries
		.map((entry) => ({ slug: entry.id, ...entry.data }))
		.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
	const equipoPorSlug = new Map(equipos.map((equipo) => [equipo.slug, equipo]));

	const resolverEquipo = (slug: string, contexto: string): Equipo => {
		const equipo = equipoPorSlug.get(slug);
		if (!equipo) {
			errorContenido(`${contexto}: el club "${slug}" no existe en src/content/equipos/`);
		}
		return equipo;
	};

	const temporadaEntry = temporadasEntries.find((entry) => entry.data.activa) ?? temporadasEntries[0];
	if (!temporadaEntry) {
		errorContenido('no hay ninguna temporada en src/content/temporadas/');
	}
	const temporada: Temporada = { slug: temporadaEntry.id, ...temporadaEntry.data };

	const jornadas: Jornada[] = jornadasEntries
		.filter((entry) => entry.data.temporada === temporada.slug)
		.sort((a, b) => a.data.numero - b.data.numero)
		.map((entry) => ({
			temporada: entry.data.temporada,
			numero: entry.data.numero,
			nombre: entry.data.nombre,
			fecha_inicio: entry.data.fecha_inicio,
			fecha_fin: entry.data.fecha_fin,
			partidos: entry.data.partidos
				.map((partido) => ({
					slug: partido.slug,
					temporada: entry.data.temporada,
					jornada: { numero: entry.data.numero, nombre: entry.data.nombre },
					fecha: partido.fecha,
					hora: partido.hora,
					cancha: partido.cancha,
					equipo1: resolverEquipo(partido.equipo1, partido.slug),
					equipo2: resolverEquipo(partido.equipo2, partido.slug),
					goles1: partido.goles1,
					goles2: partido.goles2,
					estado: partido.estado,
				}))
				.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora)),
		}));

	const partidos = jornadas.flatMap((jornada) => jornada.partidos);
	const partidoPorSlug = new Map(partidos.map((partido) => [partido.slug, partido]));

	const goles: Gol[] = golesEntries
		.filter((entry) => entry.data.temporada === temporada.slug)
		.flatMap((entry) => entry.data.goles)
		.map((gol) => {
			const partido = partidoPorSlug.get(gol.partido);
			if (!partido) {
				errorContenido(
					`gol de "${gol.jugador}": el partido "${gol.partido}" no existe en src/content/jornadas/`,
				);
			}
			return {
				jugador: gol.jugador,
				equipo: resolverEquipo(gol.equipo, `gol de "${gol.jugador}"`),
				partido,
			};
		});

	return { equipos, temporada, jornadas, partidos, goles };
}

/** Clubes ordenados alfabéticamente. */
export async function getEquipos(): Promise<Equipo[]> {
	return (await cargar()).equipos;
}

/** Un club por su slug, o `undefined` si no existe. */
export async function getEquipo(slug: string): Promise<Equipo | undefined> {
	return (await cargar()).equipos.find((equipo) => equipo.slug === slug);
}

/** Temporada activa (o la primera si ninguna está marcada). */
export async function getTemporada(): Promise<Temporada> {
	return (await cargar()).temporada;
}

/** Jornadas de la temporada activa, ordenadas por número. */
export async function getJornadas(): Promise<Jornada[]> {
	return (await cargar()).jornadas;
}

/** Todos los partidos de la temporada activa, ordenados por fecha y hora. */
export async function getPartidos(): Promise<Partido[]> {
	return (await cargar()).partidos;
}

/** Un partido por su slug, o `undefined` si no existe. */
export async function getPartido(slug: string): Promise<Partido | undefined> {
	return (await cargar()).partidos.find((partido) => partido.slug === slug);
}

/** Próximos partidos programados, del más cercano al más lejano. */
export async function getProximosPartidos(limite = 5): Promise<Partido[]> {
	const { partidos } = await cargar();
	return partidos.filter((partido) => partido.estado === 'programado').slice(0, limite);
}

/**
 * Partidos programados de la próxima fecha.
 *
 * Toma la primera jornada (por número) que todavía tiene partidos por jugar y
 * devuelve solo esos partidos, sin mezclar los de la fecha siguiente.
 */
export async function getProximosPartidosDeFecha(): Promise<Partido[]> {
	const { jornadas } = await cargar();
	const jornada = jornadas.find((j) => j.partidos.some((partido) => partido.estado === 'programado'));
	return jornada?.partidos.filter((partido) => partido.estado === 'programado') ?? [];
}

/** Últimos partidos finalizados, del más reciente al más antiguo. */
export async function getUltimosResultados(limite = 5): Promise<Partido[]> {
	const { partidos } = await cargar();
	return partidos
		.filter((partido) => partido.estado === 'finalizado')
		.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora))
		.slice(0, limite);
}

/** Goles de un partido, en el orden en que están escritos en el archivo. */
export async function getGolesDePartido(slug: string): Promise<Gol[]> {
	const { goles } = await cargar();
	return goles.filter((gol) => gol.partido.slug === slug);
}

/** Goles convertidos por un club, agrupados por jugador. */
export async function getGoleadoresDeEquipo(slug: string): Promise<Goleador[]> {
	const goleadores = await getGoleadores();
	return goleadores.filter((goleador) => goleador.equipo.slug === slug);
}

/**
 * Ranking de goleadores de la temporada activa.
 *
 * Agrupa por club y nombre normalizado, así "José Millán" y "Jose Millan"
 * cuentan como el mismo jugador.
 */
export async function getGoleadores(limite?: number): Promise<Goleador[]> {
	const { goles } = await cargar();
	const acumulado = new Map<string, Goleador>();

	for (const gol of goles) {
		const clave = `${gol.equipo.slug}|${normalizarNombre(gol.jugador)}`;
		const actual = acumulado.get(clave);
		if (actual) {
			actual.goles += 1;
		} else {
			acumulado.set(clave, { jugador: gol.jugador, equipo: gol.equipo, goles: 1 });
		}
	}

	const ranking = [...acumulado.values()].sort(
		(a, b) => b.goles - a.goles || a.jugador.localeCompare(b.jugador, 'es'),
	);
	return limite ? ranking.slice(0, limite) : ranking;
}

/**
 * Tabla de posiciones calculada desde los partidos finalizados.
 *
 * Puntos: 3 victoria, 1 empate, 0 derrota. Se suman los ajustes definidos en
 * la temporada (sanciones). Desempate: puntos, diferencia de gol, goles a favor
 * y nombre del club.
 */
export async function calcularTabla(): Promise<FilaTabla[]> {
	const { equipos, partidos, temporada } = await cargar();

	const filas = new Map<string, FilaTabla>(
		equipos.map((equipo) => [
			equipo.slug,
			{ pos: 0, equipo, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0, ajuste: 0 },
		]),
	);

	for (const partido of partidos) {
		if (partido.estado !== 'finalizado') continue;
		if (partido.goles1 === null || partido.goles2 === null) continue;

		const local = filas.get(partido.equipo1.slug);
		const visita = filas.get(partido.equipo2.slug);
		if (!local || !visita) {
			errorContenido(`el partido "${partido.slug}" tiene clubes que no están en la tabla`);
		}

		local.pj += 1;
		visita.pj += 1;
		local.gf += partido.goles1;
		local.gc += partido.goles2;
		visita.gf += partido.goles2;
		visita.gc += partido.goles1;

		if (partido.goles1 > partido.goles2) {
			local.g += 1;
			visita.p += 1;
			local.pts += 3;
		} else if (partido.goles1 < partido.goles2) {
			visita.g += 1;
			local.p += 1;
			visita.pts += 3;
		} else {
			local.e += 1;
			visita.e += 1;
			local.pts += 1;
			visita.pts += 1;
		}
	}

	for (const ajuste of temporada.ajustes) {
		const fila = filas.get(ajuste.equipo);
		if (!fila) {
			errorContenido(`ajuste de puntos: el club "${ajuste.equipo}" no existe`);
		}
		fila.pts += ajuste.puntos;
		fila.ajuste += ajuste.puntos;
	}

	const tabla = [...filas.values()];
	for (const fila of tabla) {
		fila.dg = fila.gf - fila.gc;
	}

	tabla.sort(
		(a, b) =>
			b.pts - a.pts ||
			b.dg - a.dg ||
			b.gf - a.gf ||
			a.equipo.nombre.localeCompare(b.equipo.nombre, 'es'),
	);
	tabla.forEach((fila, indice) => {
		fila.pos = indice + 1;
	});

	return tabla;
}

/** Fila de la tabla correspondiente a un club. */
export async function getFilaTabla(slug: string): Promise<FilaTabla | undefined> {
	const tabla = await calcularTabla();
	return tabla.find((fila) => fila.equipo.slug === slug);
}

/** Partidos de un club, del más reciente al más antiguo. */
export async function getPartidosDeEquipo(slug: string): Promise<Partido[]> {
	const { partidos } = await cargar();
	return partidos
		.filter((partido) => partido.equipo1.slug === slug || partido.equipo2.slug === slug)
		.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
}
