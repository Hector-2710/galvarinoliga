/**
 * Declaraciones de tipos globales para el proyecto Galvarino Liga Fútbol.
 *
 * Este archivo extiende los tipos base de Astro para incluir las propiedades
 * personalizadas que el middleware inyecta en `context.locals`.
 */

/// <reference types="astro/client" />

declare namespace App {
	/**
	 * Interfaz extendida de `Astro.Locals`.
	 * El middleware de autenticación (`src/middleware.ts`) asigna estas propiedades
	 * antes de que las rutas protegidas procesen la solicitud.
	 */
	interface Locals {
		/** Usuario autenticado obtenido desde Supabase Auth. */
		user: import('@supabase/supabase-js').User;
		/** Rol administrativo del usuario: 'admin' (control total) o 'editor' (gestión de contenido). */
		adminRole: 'admin' | 'editor';
	}
}
