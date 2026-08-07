-- ═══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Preferencia de pago al apartar productos desde la app
-- Pegar y ejecutar COMPLETO en: Neon Console → SQL Editor → Run
-- (Es idempotente: se puede correr dos veces sin dañar nada.)
-- ═══════════════════════════════════════════════════════════════════

-- Preferencia de pago que el miembro expresa al apartar desde la app
-- (informativo para el personal — el cobro real siempre lo registra el
-- staff en la sede; la app no procesa pagos).
DO $$ BEGIN
  CREATE TYPE "sale_payment_intent" AS ENUM ('luego', 'abono', 'mensualidad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS payment_intent "sale_payment_intent" DEFAULT 'luego' NOT NULL,
  ADD COLUMN IF NOT EXISTS intended_amount numeric(10,2);

-- Verificación
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'sales' AND column_name IN ('payment_intent', 'intended_amount');
