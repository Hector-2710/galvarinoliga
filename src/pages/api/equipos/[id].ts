import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ params, request, cookies }) => {
	const supabase = createServerSupabase({ request, cookies });
	const { id } = params;

	const { data, error } = await supabase
		.from('equipos')
		.select('*, jugadores(*), cuerpo_tecnico(*)')
		.eq('id', id)
		.single();

	if (error) {
		return new Response(JSON.stringify({ error: 'Equipo no encontrado' }), {
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

		if (body.nombre !== undefined) updateData.nombre = body.nombre;
		if (body.ano_creacion !== undefined) updateData.ano_creacion = body.ano_creacion;
		if (body.presidente !== undefined) updateData.presidente = body.presidente;
		if (body.secretaria !== undefined) updateData.secretaria = body.secretaria;
		if (body.tesorera !== undefined) updateData.tesorera = body.tesorera;
		if (body.color_principal !== undefined) updateData.color_principal = body.color_principal;
		if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;

		const { data, error } = await supabase
			.from('equipos')
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
		.from('equipos')
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
