-- ═══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Planes reales del negocio (Básico/VIP, semanal, quincenal,
-- pausas de membresía) + precios reales de las 3 sedes
-- Pegar y ejecutar COMPLETO en: Neon Console → SQL Editor → Run
-- (Es idempotente: se puede correr dos veces sin dañar nada.)
-- ═══════════════════════════════════════════════════════════════════

-- Nuevos valores del plan: semanal y quincenal (además de mensual/trimestral/anual)
ALTER TYPE "plan" ADD VALUE IF NOT EXISTS 'semanal';
ALTER TYPE "plan" ADD VALUE IF NOT EXISTS 'quincenal';

-- Nivel de acceso: básico o VIP (área del 4to. nivel)
DO $$ BEGIN
  CREATE TYPE "access_level" AS ENUM ('basico', 'vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Nivel de acceso del miembro
ALTER TABLE members ADD COLUMN IF NOT EXISTS access_level "access_level" DEFAULT 'basico' NOT NULL;

-- Nivel de acceso del pago por día (visitantes sin membresía)
ALTER TABLE day_passes ADD COLUMN IF NOT EXISTS access_level "access_level" DEFAULT 'basico' NOT NULL;

-- Matriz de precios Básico/VIP y ciclos cortos (semanal/quincenal), por sede
ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS pricing_monthly_vip numeric(10,2),
  ADD COLUMN IF NOT EXISTS pricing_weekly_basico numeric(10,2),
  ADD COLUMN IF NOT EXISTS pricing_weekly_vip numeric(10,2),
  ADD COLUMN IF NOT EXISTS pricing_biweekly_basico numeric(10,2),
  ADD COLUMN IF NOT EXISTS pricing_biweekly_vip numeric(10,2),
  ADD COLUMN IF NOT EXISTS pricing_day_pass_vip numeric(10,2);

-- Pausas de membresía ("no se repone tiempo, salvo aviso con causa justificada")
CREATE TABLE IF NOT EXISTS member_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  member_id uuid NOT NULL REFERENCES members(id),
  days integer NOT NULL,
  reason text NOT NULL,
  proof_url varchar(1024),
  previous_end date NOT NULL,
  new_end date NOT NULL,
  registered_by uuid REFERENCES system_users(id),
  created_at timestamp DEFAULT now() NOT NULL
);

-- ─── Precios reales del documento "Planes AQUARIUS GYM", aplicados como
-- punto de partida IGUAL en las 3 sedes (Tacaná, Cuilco, San Marcos).
-- Ajustables luego por sede desde el CRM → Precios.
UPDATE gyms SET
  enrollment_fee            = 50.00,
  pricing_day_pass          = 30.00,
  pricing_day_pass_vip      = 40.00,
  pricing_weekly_basico     = 100.00,
  pricing_weekly_vip        = 125.00,
  pricing_biweekly_basico   = 150.00,
  pricing_biweekly_vip      = 175.00,
  pricing_monthly           = 250.00,
  pricing_monthly_vip       = 279.00,
  pricing_quarterly         = 675.00,
  pricing_group_default     = 250.00;

-- Verificación
SELECT name, enrollment_fee, pricing_day_pass, pricing_day_pass_vip,
       pricing_weekly_basico, pricing_weekly_vip,
       pricing_biweekly_basico, pricing_biweekly_vip,
       pricing_monthly, pricing_monthly_vip, pricing_quarterly
FROM gyms ORDER BY name;

SELECT 'member_pauses' AS tabla, count(*) FROM member_pauses;
