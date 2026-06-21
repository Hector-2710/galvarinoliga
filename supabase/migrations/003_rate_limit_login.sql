-- ============================================================
-- Migration 003: Rate limiting para intentos de login
-- ============================================================
-- Almacena intentos de login para prevenir ataques de fuerza bruta.
-- Límite: 10 intentos por IP cada 15 minutos.
-- Limpieza automática: registros > 24h se eliminan.
-- ============================================================

-- 1. Tabla de intentos de login
CREATE TABLE intentos_login (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ip_address TEXT NOT NULL,
  intento_exitoso BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_intentos_login_ip ON intentos_login(ip_address);
CREATE INDEX idx_intentos_login_created ON intentos_login(created_at);

-- 2. Función de limpieza automática (eliminar registros > 24h)
CREATE OR REPLACE FUNCTION public.cleanup_intentos_login()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM intentos_login WHERE created_at < now() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: limpia registros antiguos después de cada INSERT
CREATE TRIGGER trigger_cleanup_intentos_login
  AFTER INSERT ON intentos_login
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_intentos_login();

-- 3. Función para verificar rate limit
-- Retorna true si el IP ha excedido el límite de intentos
CREATE OR REPLACE FUNCTION public.rate_limit_excedido(check_ip TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  intentos_recientes INT;
BEGIN
  SELECT COUNT(*) INTO intentos_recientes
  FROM intentos_login
  WHERE ip_address = check_ip
    AND created_at > now() - INTERVAL '15 minutes'
    AND intento_exitoso = false;

  RETURN intentos_recientes >= 10;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para registrar un intento de login
CREATE OR REPLACE FUNCTION public.registrar_intento_login(check_ip TEXT, exitoso BOOLEAN)
RETURNS VOID AS $$
BEGIN
  INSERT INTO intentos_login (ip_address, intento_exitoso)
  VALUES (check_ip, exitoso);
END;
$$ LANGUAGE plpgsql;

-- 5. RLS: solo la función interna puede escribir, lectura solo para admins
ALTER TABLE intentos_login ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT via función con SECURITY DEFINER
CREATE POLICY "Solo función interna" ON intentos_login
  FOR INSERT WITH CHECK (true);

-- Admin puede consultar intentos
CREATE POLICY "Admin puede leer" ON intentos_login
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- Nadie puede modificar o eliminar directamente
CREATE POLICY "No update" ON intentos_login
  FOR UPDATE USING (false);

CREATE POLICY "No delete" ON intentos_login
  FOR DELETE USING (false);
