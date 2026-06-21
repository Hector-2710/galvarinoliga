/**
 * Middleware de seguridad y autenticación para Astro.
 *
 * Se ejecuta en cada solicitud entrante y realiza dos funciones:
 * 1. Protege las rutas administrativas verificando la sesión de Supabase y el perfil del usuario en la tabla `perfiles_admin`.
 * 2. Aplica cabeceras de seguridad HTTP (HSTS, CSP, X-Frame-Options, etc.) a todas las respuestas.
 */

import { defineMiddleware } from 'astro/middleware';
import { createServerSupabase } from './lib/supabase';

/** Rutas que requieren autenticación de administrador/editor. */
const PROTECTED_ROUTES = ['/admin'];

/** Rutas dentro de /admin que están exentas de autenticación (login y callback OAuth). */
const EXEMPT_ROUTES = ['/admin/login', '/api/auth/callback'];

/**
 * Cabeceras de seguridad HTTP aplicadas a todas las respuestas.
 *
 * - **HSTS**: Fuerza conexión HTTPS por 1 año, incluyendo subdominios.
 * - **X-Content-Type-Options**: Evita el sniffing de MIME type.
 * - **X-Frame-Options**: Previene clickjacking denegando iframes.
 * - **Referrer-Policy**: Solo envía referrer en mismo origen o a HTTPS.
 * - **Permissions-Policy**: Deshabilita geolocalización, micrófono y cámara.
 * - **CSP**: Restringe orígenes de scripts, estilos, fuentes, imágenes y conexiones.
 */
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

/**
 * Aplica las cabeceras de seguridad definidas en `SECURITY_HEADERS` a una respuesta HTTP.
 *
 * @param response - Objeto Response al que se agregarán las cabeceras.
 * @returns El mismo objeto Response con las cabeceras ya asignadas.
 */
function applySecurityHeaders(response: Response): Response {
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}
	return response;
}

/**
 * Middleware principal de Astro.
 *
 * Flujo de ejecución:
 * 1. Determina si la ruta solicitada está protegida (bajo /admin pero no en EXEMPT_ROUTES).
 * 2. Si está protegida, verifica la sesión del usuario mediante Supabase Auth.
 * 3. Si el usuario está autenticado, consulta su perfil en `perfiles_admin` para
 *    determinar su rol (`admin` o `editor`).
 * 4. Si no hay sesión o perfil, redirige según corresponda.
 * 5. Establece `context.locals.user` y `context.locals.adminRole` para las páginas admin.
 * 6. Finalmente, aplica las cabeceras de seguridad a la respuesta generada.
 *
 * @param context - Contexto de la solicitud de Astro.
 * @param next - Función para continuar con el siguiente middleware o la ruta.
 * @returns Respuesta HTTP con cabeceras de seguridad aplicadas.
 */
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

		// Verificar sesión activa mediante el token JWT de la cookie
		const { data, error } = await supabase.auth.getUser();

		if (error || !data?.user) {
			return applySecurityHeaders(context.redirect('/admin/login'));
		}

		// Verificar que el usuario tenga un perfil en perfiles_admin
		const { data: perfil } = await supabase
			.from('perfiles_admin')
			.select('rol')
			.eq('user_id', data.user.id)
			.single();

		if (!perfil) {
			// Usuario autenticado pero sin perfil admin → redirigir al inicio
			return applySecurityHeaders(context.redirect('/'));
		}

		// Exponer datos del usuario y rol en el contexto para las páginas admin
		context.locals.user = data.user;
		context.locals.adminRole = perfil.rol;
	}

	const response = await next();
	return applySecurityHeaders(response);
});
