import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const formData = await request.formData();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();

		if (!email || !password) {
			return new Response(
				JSON.stringify({ error: 'Email y contraseña requeridos' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const supabase = createServerSupabase({ request, cookies });
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return new Response(
				JSON.stringify({ error: error.message }),
				{ status: 401, headers: { 'Content-Type': 'application/json' } }
			);
		}

		return new Response(
			JSON.stringify({ success: true }),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (err) {
		return new Response(
			JSON.stringify({ error: 'Error interno del servidor' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
