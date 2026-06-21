import { defineMiddleware } from 'astro/middleware';
import { createServerSupabase } from './lib/supabase';

const PROTECTED_ROUTES = ['/admin'];
const EXEMPT_ROUTES = ['/admin/login', '/api/auth/callback'];

// Cabeceras de seguridad HTTP
const SECURITY_HEADERS: Record<string, string> = {
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
	'Content-Security-Policy': [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: https:",
		"connect-src 'self' https://*.supabase.co",
		"frame-ancestors 'none'",
		"form-action 'self'",
	].join('; '),
};

function applySecurityHeaders(response: Response): Response {
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}
	return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;

	const isProtected = PROTECTED_ROUTES.some(
		(route) => pathname.startsWith(route) && !EXEMPT_ROUTES.some((e) => pathname.startsWith(e))
	);

	if (isProtected) {
		const supabase = createServerSupabase({
			request: context.request,
			cookies: context.cookies,
		});

		const { data, error } = await supabase.auth.getUser();

		if (error || !data?.user) {
			return applySecurityHeaders(context.redirect('/admin/login'));
		}

		const { data: perfil } = await supabase
			.from('perfiles_admin')
			.select('rol')
			.eq('user_id', data.user.id)
			.single();

		if (!perfil) {
			return applySecurityHeaders(context.redirect('/'));
		}

		context.locals.user = data.user;
		context.locals.adminRole = perfil.rol;
	}

	const response = await next();
	return applySecurityHeaders(response);
});
