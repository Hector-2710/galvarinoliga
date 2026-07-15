import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
	const supabase = createServerSupabase({ request, cookies });
	const partidoId = url.searchParams.get('partido_id');

	let query = supabase
		.from('asistencias')
		.select('*, jugador:jugador_id(nombre, apellido, numero_camiseta), equipos!inner(nombre)')
		.order('id');

	if (partidoId) {
		query = query.eq('partido_id', parseInt(partidoId));
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
		const { partido_id, jugador_id, equipo_id } = body;

		if (!partido_id || !jugador_id || !equipo_id) {
			return new Response(
				JSON.stringify({ error: 'Campos requeridos: partido_id, jugador_id, equipo_id' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const { data, error } = await supabase
			.from('asistencias')
			.insert({ partido_id, jugador_id, equipo_id })
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
