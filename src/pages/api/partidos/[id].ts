import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase';

export const prerender = false;

/**
 * GET /api/partidos/:id — Obtener un partido por ID
 */
export const GET: APIRoute = async ({ params, request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });
	const { id } = params;

	const { data, error } = await supabase
		.from('partidos')
		.select(`
			*,
			equipo1:equipo1_id(id, nombre, logo_url),
			equipo2:equipo2_id(id, nombre, logo_url),
			goles(*, jugador:jugador_id(nombre, apellido))
		`)
		.eq('id', id)
		.single();

	if (error) {
		return new Response(JSON.stringify({ error: 'Partido no encontrado' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify(data), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

/**
 * PUT /api/partidos/:id — Actualizar un partido
 */
export const PUT: APIRoute = async ({ params, request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });

	// Verificar autenticación
	const { data: userData, error: authError } = await supabase.auth.getUser();
	if (authError || !userData?.user) {
		return new Response(JSON.stringify({ error: 'No autorizado' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const { id } = params;

	try {
		const body = await request.json();
		const { equipo1_id, equipo2_id, fecha, hora, cancha, goles1, goles2, estado, jornada_id } = body;

		const updateData: Record<string, unknown> = {};

		if (equipo1_id !== undefined) updateData.equipo1_id = equipo1_id;
		if (equipo2_id !== undefined) updateData.equipo2_id = equipo2_id;
		if (fecha !== undefined) updateData.fecha = fecha;
		if (hora !== undefined) updateData.hora = hora;
		if (cancha !== undefined) updateData.cancha = cancha;
		if (goles1 !== undefined) updateData.goles1 = goles1;
		if (goles2 !== undefined) updateData.goles2 = goles2;
		if (estado !== undefined) updateData.estado = estado;
		if (jornada_id !== undefined) updateData.jornada_id = jornada_id;

		const { data, error } = await supabase
			.from('partidos')
			.update(updateData)
			.eq('id', id)
			.select()
			.single();

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
	} catch {
		return new Response(JSON.stringify({ error: 'JSON inválido' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

/**
 * DELETE /api/partidos/:id — Eliminar un partido
 */
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });

	// Verificar autenticación
	const { data: userData, error: authError } = await supabase.auth.getUser();
	if (authError || !userData?.user) {
		return new Response(JSON.stringify({ error: 'No autorizado' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const { id } = params;

	const { error } = await supabase
		.from('partidos')
		.delete()
		.eq('id', id);

	if (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
