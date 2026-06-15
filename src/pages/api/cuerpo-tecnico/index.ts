import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
	const supabase = createServerSupabase({ request, cookies });
	const equipoId = url.searchParams.get('equipo_id');

	let query = supabase
		.from('cuerpo_tecnico')
		.select('*, equipos(nombre)')
		.order('nombre');

	if (equipoId) {
		query = query.eq('equipo_id', parseInt(equipoId));
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
		const { equipo_id, nombre, rol } = body;

		if (!equipo_id || !nombre || !rol) {
			return new Response(
				JSON.stringify({ error: 'Campos requeridos: equipo_id, nombre, rol' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const { data, error } = await supabase
			.from('cuerpo_tecnico')
			.insert({ equipo_id, nombre, rol })
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
