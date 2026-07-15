import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ params, request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });
	const { id } = params;

	const { data, error } = await supabase
		.from('asistencias')
		.select('*, jugador:jugador_id(nombre, apellido, numero_camiseta)')
		.eq('id', id)
		.single();

	if (error) {
		return new Response(JSON.stringify({ error: 'Asistencia no encontrada' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify(data), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });

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
		const updateData: Record<string, unknown> = {};

		if (body.gol_id !== undefined) updateData.gol_id = body.gol_id;
		if (body.jugador_id !== undefined) updateData.jugador_id = body.jugador_id;

		const { data, error } = await supabase
			.from('asistencias')
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
		return new Response(JSON.stringify({ error: 'JSON invalido' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });

	const { data: userData, error: authError } = await supabase.auth.getUser();
	if (authError || !userData?.user) {
		return new Response(JSON.stringify({ error: 'No autorizado' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const { id } = params;

	const { error } = await supabase
		.from('asistencias')
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
