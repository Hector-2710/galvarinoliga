-- Seed data for Galvarino Liga Fútbol
-- Ejecutar después de la migración 001_schema.sql
-- Limpia datos existentes antes de insertar (útil para re-ejecuciones)
TRUNCATE TABLE asistencias, goles, tarjetas, partidos, cuerpo_tecnico, titulos, jugadores, jornadas, equipos, temporadas RESTART IDENTITY CASCADE;

-- Temporada actual
INSERT INTO temporadas (nombre, fecha_inicio, fecha_fin, activa)
VALUES ('Temporada 2026', '2026-03-01', '2026-12-31', true);

-- Equipos
INSERT INTO equipos (nombre, ano_creacion, presidente, color_principal) VALUES
  ('Galvarino', 2010, 'Carlos Muñoz', '#E61E2A'),
  ('Madregal', 2005, 'Marco Antilef', '#13aecd'),
  ('Construccion', 2012, 'Roberto Cayun', '#0b0b8a'),
  ('Centenario', 2008, 'Pedro Huenchul', '#FFD700'),
  ('San Antonio', 2015, 'Luis Calfunao', '#1dc314'),
  ('Liceo', 2011, 'Ana Millán', '#fc8b00');

-- Jugadores
INSERT INTO jugadores (equipo_id, nombre, apellido, posicion, numero_camiseta) VALUES
  (1, 'Carlos', 'Muñoz', 'Arquero', 1),
  (1, 'Pedro', 'Lefián', 'Defensa', 2),
  (1, 'Juan', 'Cayupan', 'Mediocampista', 8),
  (1, 'José', 'Millán', 'Delantero', 9),
  (1, 'Miguel', 'Pichun', 'Delantero', 7),
  (2, 'Luis', 'Antilef', 'Arquero', 1),
  (2, 'Andrés', 'Huircán', 'Defensa', 4),
  (2, 'Diego', 'Calfuleo', 'Mediocampista', 10),
  (2, 'Francisco', 'Lienlaf', 'Delantero', 11),
  (3, 'Roberto', 'Cayun', 'Arquero', 1),
  (3, 'Pablo', 'Marileo', 'Defensa', 3),
  (3, 'Héctor', 'Cumilef', 'Mediocampista', 6),
  (3, 'Sergio', 'Lefián', 'Delantero', 9),
  (4, 'Pedro', 'Huenchul', 'Arquero', 12),
  (4, 'Jorge', 'Paillal', 'Defensa', 5),
  (4, 'Mario', 'Caniulaf', 'Mediocampista', 14),
  (4, 'Luis', 'Raiman', 'Delantero', 7),
  (5, 'Luis', 'Calfunao', 'Arquero', 1),
  (5, 'Manuel', 'Lincovil', 'Defensa', 2),
  (5, 'David', 'Carrillo', 'Mediocampista', 8),
  (5, 'Ángel', 'Quilaqueo', 'Delantero', 10),
  (6, 'Ana', 'Millán', 'Arquero', 1),
  (6, 'Cristian', 'Lincoñir', 'Defensa', 4),
  (6, 'Felipe', 'Cayulef', 'Mediocampista', 7),
  (6, 'Tomás', 'Levinao', 'Delantero', 9);

-- Cuerpo Técnico
INSERT INTO cuerpo_tecnico (equipo_id, nombre, rol) VALUES
  (1, 'Carlos Muñoz', 'DT'),
  (1, 'Pedro Lefián', 'Asistente'),
  (2, 'Marco Antilef', 'DT'),
  (3, 'Roberto Cayun', 'DT'),
  (4, 'Pedro Huenchul', 'DT'),
  (5, 'Luis Calfunao', 'DT'),
  (6, 'Ana Millán', 'DT');

-- Jornadas
INSERT INTO jornadas (temporada_id, numero, nombre, fecha_inicio, fecha_fin) VALUES
  (1, 1, 'Fecha 1', '2026-04-05', '2026-04-06'),
  (1, 2, 'Fecha 2', '2026-04-12', '2026-04-13'),
  (1, 3, 'Fecha 3', '2026-04-19', '2026-04-20'),
  (1, 4, 'Fecha 4', '2026-04-26', '2026-04-27'),
  (1, 5, 'Fecha 5', '2026-05-03', '2026-05-04'),
  (1, 6, 'Fecha 6', '2026-05-10', '2026-05-11');

-- Partidos (Fecha 1-6 finalizados, Fecha 7 programados)
INSERT INTO partidos (temporada_id, jornada_id, equipo1_id, equipo2_id, fecha, hora, cancha, goles1, goles2, estado) VALUES
  (1, 1, 1, 2, '2026-04-05', '16:00', 'Estadio Municipal', 2, 1, 'finalizado'),
  (1, 1, 3, 4, '2026-04-05', '18:00', 'Cancha Imperial', 0, 0, 'finalizado'),
  (1, 1, 5, 6, '2026-04-06', '16:00', 'Estadio Nueva Imperial', 1, 2, 'finalizado'),
  (1, 2, 2, 3, '2026-04-12', '16:00', 'Estadio Temuco', 3, 1, 'finalizado'),
  (1, 2, 4, 5, '2026-04-12', '18:00', 'Cancha Cholchol', 2, 2, 'finalizado'),
  (1, 2, 6, 1, '2026-04-13', '16:00', 'Estadio Carahue', 0, 2, 'finalizado'),
  (1, 3, 1, 3, '2026-04-19', '16:00', 'Estadio Municipal', 1, 0, 'finalizado'),
  (1, 3, 5, 2, '2026-04-19', '18:00', 'Estadio Nueva Imperial', 0, 1, 'finalizado'),
  (1, 3, 4, 6, '2026-04-20', '16:00', 'Cancha Cholchol', 3, 1, 'finalizado'),
  (1, 4, 2, 4, '2026-04-26', '16:00', 'Estadio Temuco', 2, 0, 'finalizado'),
  (1, 4, 3, 5, '2026-04-26', '18:00', 'Cancha Imperial', 4, 0, 'finalizado'),
  (1, 4, 6, 1, '2026-04-27', '16:00', 'Estadio Carahue', 1, 1, 'finalizado'),
  (1, 5, 1, 5, '2026-05-03', '16:00', 'Estadio Municipal', 3, 0, 'finalizado'),
  (1, 5, 4, 2, '2026-05-03', '18:00', 'Cancha Cholchol', 1, 2, 'finalizado'),
  (1, 5, 6, 3, '2026-05-04', '16:00', 'Estadio Carahue', 0, 0, 'finalizado'),
  (1, 6, 2, 6, '2026-05-10', '16:00', 'Estadio Temuco', 2, 0, 'finalizado'),
  (1, 6, 3, 1, '2026-05-10', '18:00', 'Cancha Imperial', 1, 2, 'finalizado'),
  (1, 6, 5, 4, '2026-05-11', '16:00', 'Estadio Nueva Imperial', 1, 1, 'finalizado');

-- Próximos partidos (Fecha 7 - programados)
INSERT INTO partidos (temporada_id, equipo1_id, equipo2_id, fecha, hora, cancha, estado) VALUES
  (1, 1, 4, '2026-05-31', '16:00', 'Estadio Municipal', 'programado'),
  (1, 2, 5, '2026-05-31', '18:00', 'Estadio Temuco', 'programado'),
  (1, 3, 6, '2026-06-01', '16:00', 'Cancha Imperial', 'programado');

-- Goles (sin minuto ni tipo)
INSERT INTO goles (partido_id, jugador_id, equipo_id) VALUES
  (1, 4, 1), (1, 5, 1), (1, 8, 2),
  (3, 21, 5), (3, 25, 6), (3, 24, 6),
  (4, 9, 2), (4, 8, 2), (4, 9, 2), (4, 13, 3),
  (5, 16, 4), (5, 17, 4), (5, 21, 5), (5, 20, 5),
  (6, 4, 1), (6, 3, 1),
  (7, 5, 1),
  (8, 9, 2),
  (9, 15, 4), (9, 16, 4), (9, 17, 4), (9, 25, 6),
  (10, 8, 2), (10, 9, 2),
  (11, 13, 3), (11, 12, 3), (11, 13, 3), (11, 13, 3),
  (12, 24, 6), (12, 4, 1),
  (13, 4, 1), (13, 3, 1), (13, 5, 1),
  (14, 16, 4), (14, 8, 2), (14, 9, 2),
  (16, 9, 2), (16, 8, 2),
  (17, 12, 3), (17, 4, 1), (17, 5, 1),
  (18, 21, 5), (18, 16, 4);

-- Asistencias
INSERT INTO asistencias (gol_id, jugador_id) VALUES
  (1, 3), (2, 3), (3, 10), (6, 22), (7, 22),
  (8, 10), (9, 6), (10, 7), (11, 13), (12, 14),
  (13, 20), (14, 19), (15, 3), (16, 4),
  (17, 3), (18, 10), (19, 15), (20, 15), (21, 14),
  (22, 10), (23, 6), (24, 12), (25, 11), (26, 12),
  (27, 12), (28, 22), (29, 3), (30, 4), (31, 3),
  (32, 15), (33, 6), (34, 7), (37, 6), (38, 10),
  (39, 11), (40, 4), (41, 3), (42, 20), (43, 15);

-- Tarjetas (sin minuto)
INSERT INTO tarjetas (partido_id, jugador_id, equipo_id, tipo) VALUES
  (1, 6, 2, 'amarilla'),
  (1, 5, 1, 'amarilla'),
  (4, 11, 3, 'amarilla'),
  (4, 10, 2, 'amarilla'),
  (6, 23, 6, 'amarilla'),
  (6, 22, 6, 'roja'),
  (9, 25, 6, 'amarilla'),
  (11, 19, 5, 'amarilla'),
  (11, 20, 5, 'roja'),
  (13, 19, 5, 'amarilla'),
  (14, 14, 4, 'amarilla'),
  (17, 13, 3, 'amarilla');
