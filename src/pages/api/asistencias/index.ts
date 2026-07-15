import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
	const supabase = createServerSupabase({ request, cookies });
	const golId = url.searchParams.get('gol_id');

	let query = supabase
		.from('asistencias')
		.select('*, jugador:jugador_id(nombre, apellido, numero_camiseta), gol:gol_id(partido:partidos(fecha, estado), jugador:jugadores(nombre, apellido), equipo:equipos(nombre))')
		.order('id');

	if (golId) {
		query = query.eq('gol_id', parseInt(golId));
	}

	const { data, error } = await query;

	if (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify(data), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });

	const { data: userData, error: authError } = await supabase.auth.getUser();
	if (authError || !userData?.user) {
		return new Response(JSON.stringify({ error: 'No autorizado' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const body = await request.json();
		const { gol_id, jugador_id } = body;

		if (!gol_id || !jugador_id) {
			return new Response(
				JSON.stringify({ error: 'Campos requeridos: gol_id, jugador_id' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const { data, error } = await supabase
			.from('asistencias')
			.insert({ gol_id, jugador_id })
			.select()
			.single();

		if (error) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify(data), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch {
		return new Response(JSON.stringify({ error: 'JSON invalido' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
