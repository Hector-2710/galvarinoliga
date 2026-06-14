import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const supabase = createServerSupabase({ request, cookies });
		await supabase.auth.signOut();

		return new Response(
			JSON.stringify({ success: true }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch {
		return new Response(
			JSON.stringify({ error: 'Error al cerrar sesión' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
