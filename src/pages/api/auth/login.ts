import type { APIRoute } from 'astro';
import { createServerSupabase, createAdminSupabase } from '../../../lib/supabase';

export const prerender = false;

function getClientIP(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim();
	const cfIP = request.headers.get('cf-connecting-ip');
	if (cfIP) return cfIP;
	return '127.0.0.1';
}

export const POST: APIRoute = async ({ request, cookies }) => {
	// Usar admin client para rate limiting (no requiere sesión de usuario)
	const adminSupabase = createAdminSupabase();
	const clientIP = getClientIP(request);

	try {
		// ── Verificar rate limit ──────────────────────────────────
		const { data: excedido } = await adminSupabase.rpc('rate_limit_excedido', {
			check_ip: clientIP,
		});

		if (excedido === true) {
			// Registrar intento fallido por rate limit
			await adminSupabase.rpc('registrar_intento_login', {
				check_ip: clientIP,
				exitoso: false,
			});

			return new Response(
				JSON.stringify({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }),
				{ status: 429, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// ── Procesar credenciales ─────────────────────────────────
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

		// ── Registrar intento ─────────────────────────────────────
		const exitoso = !error;
		await adminSupabase.rpc('registrar_intento_login', {
			check_ip: clientIP,
			exitoso,
		});

		if (error) {
			// Mensaje genérico — no revelar si el email existe o no
			return new Response(
				JSON.stringify({ error: 'Credenciales inválidas' }),
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
