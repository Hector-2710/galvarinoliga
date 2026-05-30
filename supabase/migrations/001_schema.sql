-- ============================================================
-- Migration 001: Esquema Liga de Fútbol Galvarino (Simplificado)
-- ============================================================

-- 1. TABLAS PRINCIPALES
-- ---------------------

-- 1.1 Temporadas
CREATE TABLE temporadas (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activa BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Equipos
CREATE TABLE equipos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre TEXT NOT NULL,
  ano_creacion SMALLINT,
  logo_url TEXT,
  presidente TEXT,
  secretaria TEXT,
  tesorera TEXT,
  color_principal TEXT DEFAULT '#E61E2A',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Jugadores
CREATE TABLE jugadores (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  equipo_id BIGINT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  fecha_nacimiento DATE,
  posicion TEXT CHECK (posicion IN ('Arquero', 'Defensa', 'Mediocampista', 'Delantero')),
  numero_camiseta SMALLINT,
  foto_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.4 Cuerpo Técnico
CREATE TABLE cuerpo_tecnico (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  equipo_id BIGINT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('DT', 'Asistente')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.5 Títulos
CREATE TABLE titulos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  equipo_id BIGINT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  ano SMALLINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.6 Jornadas
CREATE TABLE jornadas (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  temporada_id BIGINT NOT NULL REFERENCES temporadas(id) ON DELETE CASCADE,
  numero SMALLINT NOT NULL,
  nombre TEXT NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.7 Partidos
CREATE TABLE partidos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  temporada_id BIGINT REFERENCES temporadas(id),
  jornada_id BIGINT REFERENCES jornadas(id),
  equipo1_id BIGINT NOT NULL REFERENCES equipos(id),
  equipo2_id BIGINT NOT NULL REFERENCES equipos(id),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  cancha TEXT NOT NULL,
  goles1 SMALLINT,
  goles2 SMALLINT,
  estado TEXT NOT NULL DEFAULT 'programado'
    CHECK (estado IN ('programado', 'en_vivo', 'finalizado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT equipos_distintos CHECK (equipo1_id != equipo2_id)
);

-- 1.8 Goles
CREATE TABLE goles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  partido_id BIGINT NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id BIGINT NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  equipo_id BIGINT NOT NULL REFERENCES equipos(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.9 Asistencias
CREATE TABLE asistencias (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  gol_id BIGINT NOT NULL REFERENCES goles(id) ON DELETE CASCADE,
  jugador_id BIGINT NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.10 Tarjetas
CREATE TABLE tarjetas (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  partido_id BIGINT NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id BIGINT NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  equipo_id BIGINT NOT NULL REFERENCES equipos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('amarilla', 'roja')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.11 Perfiles de Administradores (vinculados a auth.users de Supabase)
CREATE TABLE perfiles_admin (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'editor' CHECK (rol IN ('admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ÍNDICES
-- ----------

CREATE INDEX idx_jugadores_equipo ON jugadores(equipo_id);
CREATE INDEX idx_partidos_temporada ON partidos(temporada_id);
CREATE INDEX idx_partidos_jornada ON partidos(jornada_id);
CREATE INDEX idx_partidos_equipo1 ON partidos(equipo1_id);
CREATE INDEX idx_partidos_equipo2 ON partidos(equipo2_id);
CREATE INDEX idx_partidos_fecha ON partidos(fecha);
CREATE INDEX idx_goles_partido ON goles(partido_id);
CREATE INDEX idx_goles_jugador ON goles(jugador_id);
CREATE INDEX idx_tarjetas_partido ON tarjetas(partido_id);
CREATE INDEX idx_tarjetas_jugador ON tarjetas(jugador_id);

-- 3. VISTAS
-- ---------

-- 3.1 Tabla de posiciones
CREATE VIEW vista_tabla_posiciones AS
SELECT
  e.id AS equipo_id,
  e.nombre AS equipo_nombre,
  COUNT(CASE WHEN p.estado = 'finalizado' AND (p.equipo1_id = e.id OR p.equipo2_id = e.id) THEN 1 END) AS pj,
  COUNT(CASE WHEN (p.equipo1_id = e.id AND p.goles1 > p.goles2)
              OR (p.equipo2_id = e.id AND p.goles2 > p.goles1) THEN 1 END) AS g,
  COUNT(CASE WHEN p.estado = 'finalizado' AND p.goles1 = p.goles2
              AND (p.equipo1_id = e.id OR p.equipo2_id = e.id) THEN 1 END) AS e,
  COUNT(CASE WHEN (p.equipo1_id = e.id AND p.goles1 < p.goles2)
              OR (p.equipo2_id = e.id AND p.goles2 < p.goles1) THEN 1 END) AS p,
  COALESCE(SUM(CASE WHEN p.equipo1_id = e.id THEN p.goles1 ELSE 0 END), 0) +
  COALESCE(SUM(CASE WHEN p.equipo2_id = e.id THEN p.goles2 ELSE 0 END), 0) AS gf,
  COALESCE(SUM(CASE WHEN p.equipo1_id = e.id THEN p.goles2 ELSE 0 END), 0) +
  COALESCE(SUM(CASE WHEN p.equipo2_id = e.id THEN p.goles1 ELSE 0 END), 0) AS gc,
  (COALESCE(SUM(CASE WHEN p.equipo1_id = e.id THEN p.goles1 ELSE 0 END), 0) +
   COALESCE(SUM(CASE WHEN p.equipo2_id = e.id THEN p.goles2 ELSE 0 END), 0)) -
  (COALESCE(SUM(CASE WHEN p.equipo1_id = e.id THEN p.goles2 ELSE 0 END), 0) +
   COALESCE(SUM(CASE WHEN p.equipo2_id = e.id THEN p.goles1 ELSE 0 END), 0)) AS dg,
  (COUNT(CASE WHEN (p.equipo1_id = e.id AND p.goles1 > p.goles2)
              OR (p.equipo2_id = e.id AND p.goles2 > p.goles1) THEN 1 END) * 3) +
  COUNT(CASE WHEN p.goles1 = p.goles2 AND p.estado = 'finalizado'
              AND (p.equipo1_id = e.id OR p.equipo2_id = e.id) THEN 1 END) AS pts
FROM equipos e
LEFT JOIN partidos p ON (e.id = p.equipo1_id OR e.id = p.equipo2_id)
  AND p.estado = 'finalizado'
GROUP BY e.id, e.nombre
ORDER BY pts DESC, dg DESC, gf DESC;

-- 3.2 Goleadores
CREATE VIEW vista_goleadores AS
SELECT
  j.id AS jugador_id,
  j.nombre,
  j.apellido,
  e.nombre AS equipo,
  e.id AS equipo_id,
  COUNT(g.id) AS goles
FROM jugadores j
JOIN goles g ON g.jugador_id = j.id
JOIN equipos e ON e.id = j.equipo_id
GROUP BY j.id, j.nombre, j.apellido, e.nombre, e.id
ORDER BY goles DESC;

-- 3.3 Asistidores
CREATE VIEW vista_asistidores AS
SELECT
  j.id AS jugador_id,
  j.nombre,
  j.apellido,
  e.nombre AS equipo,
  e.id AS equipo_id,
  COUNT(a.id) AS asistencias
FROM jugadores j
JOIN asistencias a ON a.jugador_id = j.id
JOIN equipos e ON e.id = j.equipo_id
GROUP BY j.id, j.nombre, j.apellido, e.nombre, e.id
ORDER BY asistencias DESC;

-- 3.4 Tarjetas acumuladas
CREATE VIEW vista_tarjetas AS
SELECT
  j.id AS jugador_id,
  j.nombre,
  j.apellido,
  e.nombre AS equipo,
  e.id AS equipo_id,
  COUNT(CASE WHEN t.tipo = 'amarilla' THEN 1 END) AS amarillas,
  COUNT(CASE WHEN t.tipo = 'roja' THEN 1 END) AS rojas
FROM jugadores j
JOIN tarjetas t ON t.jugador_id = j.id
JOIN equipos e ON e.id = j.equipo_id
GROUP BY j.id, j.nombre, j.apellido, e.nombre, e.id
ORDER BY rojas DESC, amarillas DESC;

-- 4. FUNCIÓN PARA ACTUALIZAR updated_at
-- --------------------------------------

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON partidos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 5. ROW LEVEL SECURITY (RLS)
-- ----------------------------

-- Helper: crear perfil admin al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles_admin (user_id, nombre_completo, rol)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nombre_completo', 'Admin'), 'editor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS en todas las tablas
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuerpo_tecnico ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jornadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE goles ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarjetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_admin ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura pública para datos públicos
CREATE POLICY "Lectura pública" ON equipos FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON jugadores FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON cuerpo_tecnico FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON titulos FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON temporadas FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON jornadas FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON partidos FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON goles FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON asistencias FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON tarjetas FOR SELECT USING (true);

-- Políticas: Escritura solo para admins autenticados
CREATE POLICY "Insert para admins" ON equipos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Update para admins" ON equipos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Delete para admins" ON equipos FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Insert para admins" ON jugadores FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Update para admins" ON jugadores FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Delete para admins" ON jugadores FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Insert para admins" ON partidos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Update para admins" ON partidos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Delete para admins" ON partidos FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Insert para admins" ON goles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Update para admins" ON goles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Delete para admins" ON goles FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Insert para admins" ON asistencias FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Delete para admins" ON asistencias FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Insert para admins" ON tarjetas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Delete para admins" ON tarjetas FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Insert para admins" ON cuerpo_tecnico FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Update para admins" ON cuerpo_tecnico FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Delete para admins" ON cuerpo_tecnico FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Insert para admins" ON titulos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Update para admins" ON titulos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Delete para admins" ON titulos FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Insert para admins" ON temporadas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Update para admins" ON temporadas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Insert para admins" ON jornadas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
CREATE POLICY "Update para admins" ON jornadas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles_admin WHERE user_id = auth.uid() AND rol IN ('admin', 'editor'))
);
