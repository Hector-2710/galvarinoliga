import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ params, request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });
	const { id } = params;

	const { data, error } = await supabase
		.from('jugadores')
		.select('*, equipos(nombre)')
		.eq('id', id)
		.single();

	if (error) {
		return new Response(JSON.stringify({ error: 'Jugador no encontrado' }), {
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

		if (body.equipo_id !== undefined) updateData.equipo_id = body.equipo_id;
		if (body.nombre !== undefined) updateData.nombre = body.nombre;
		if (body.apellido !== undefined) updateData.apellido = body.apellido;
		if (body.fecha_nacimiento !== undefined) updateData.fecha_nacimiento = body.fecha_nacimiento;
		if (body.posicion !== undefined) updateData.posicion = body.posicion;
		if (body.numero_camiseta !== undefined) updateData.numero_camiseta = body.numero_camiseta;
		if (body.activo !== undefined) updateData.activo = body.activo;

		const { data, error } = await supabase
			.from('jugadores')
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
		.from('jugadores')
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
