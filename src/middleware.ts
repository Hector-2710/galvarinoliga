import { defineMiddleware } from 'astro/middleware';
import { createServerSupabase } from './lib/supabase';

const PROTECTED_ROUTES = ['/admin'];
const EXEMPT_ROUTES = ['/admin/login', '/api/auth/callback'];

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
			return context.redirect('/admin/login');
		}

		const { data: perfil } = await supabase
			.from('perfiles_admin')
			.select('rol')
			.eq('user_id', data.user.id)
			.single();

		if (!perfil) {
			return context.redirect('/');
		}

		context.locals.user = data.user;
		context.locals.adminRole = perfil.rol;
	}

	return next();
});
