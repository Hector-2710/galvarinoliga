import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase';

export const prerender = false;

/**
 * GET /api/partidos — Lista todos los partidos
 */
export const GET: APIRoute = async ({ request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });

	const { data, error } = await supabase
		.from('partidos')
		.select(`
			*,
			equipo1:equipo1_id(id, nombre, logo_url),
			equipo2:equipo2_id(id, nombre, logo_url)
		`)
		.order('fecha', { ascending: false })
		.order('hora', { ascending: false });

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

/**
 * POST /api/partidos — Crear un nuevo partido
 */
export const POST: APIRoute = async ({ request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });

	// Verificar autenticación
	const { data: userData, error: authError } = await supabase.auth.getUser();
	if (authError || !userData?.user) {
		return new Response(JSON.stringify({ error: 'No autorizado' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const body = await request.json();
		const { equipo1_id, equipo2_id, fecha, hora, cancha, jornada_id } = body;

		if (!equipo1_id || !equipo2_id || !fecha || !hora || !cancha) {
			return new Response(
				JSON.stringify({ error: 'Todos los campos requeridos: equipo1_id, equipo2_id, fecha, hora, cancha' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		if (equipo1_id === equipo2_id) {
			return new Response(
				JSON.stringify({ error: 'Los equipos deben ser distintos' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const { data, error } = await supabase
			.from('partidos')
			.insert({
				equipo1_id,
				equipo2_id,
				fecha,
				hora,
				cancha,
				jornada_id: jornada_id || null,
				estado: 'programado',
			})
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
		return new Response(JSON.stringify({ error: 'JSON inválido' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
