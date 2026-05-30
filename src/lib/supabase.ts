import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import { createClient } from '@supabase/supabase-js';


// Crea un cliente Supabase para SSR (server-side rendering).
export function createServerSupabase({
	request,
	cookies,
}: {
	request: Request;
	cookies: AstroCookies;
}) {
	return createServerClient(
		import.meta.env.SUPABASE_URL,
		import.meta.env.SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll() {
					return parseCookieHeader(request.headers.get('Cookie') ?? '');
				},
				setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
					cookiesToSet.forEach(({ name, value, options }) =>
						cookies.set(name, value, options ? options : {})
					);
				},
			},
		}
	);
}

// Crea un cliente Supabase con service_role para operaciones administrativas
export function createAdminSupabase() {
	return createClient(
		import.meta.env.SUPABASE_URL,
		import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		}
	);
}
