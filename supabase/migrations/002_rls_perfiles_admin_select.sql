-- Migration 002: Add RLS SELECT policy for perfiles_admin
-- Allows authenticated users to read their own admin profile.
-- This fixes the login redirect bug where middleware could not
-- verify admin status due to missing SELECT policy.

CREATE POLICY "Usuarios ven su propio perfil" ON perfiles_admin
  FOR SELECT USING (auth.uid() = user_id);
