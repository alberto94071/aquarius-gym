-- ═══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Rutinas compartidas entre las 3 sedes
-- Pegar y ejecutar COMPLETO en: Neon Console → SQL Editor → Run
-- (Es idempotente: se puede correr dos veces sin dañar nada.)
-- ═══════════════════════════════════════════════════════════════════

-- Las rutinas ahora son como el banco de ejercicios: compartidas entre
-- las 3 sedes. gym_id queda solo como referencia informativa (de qué
-- sede la creó), ya no bloquea la asignación a miembros de otras sedes.
ALTER TABLE routines ALTER COLUMN gym_id DROP NOT NULL;

-- Verificación
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_name = 'routines' AND column_name = 'gym_id';
