-- ═══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Turnos AM/PM + módulo Ventas/Inventario + medidas nuevas
-- Pegar y ejecutar COMPLETO en: Neon Console → SQL Editor → Run
-- (Es idempotente: se puede correr dos veces sin dañar nada.)
-- ═══════════════════════════════════════════════════════════════════

-- Enums nuevos
DO $$ BEGIN
  CREATE TYPE "shift" AS ENUM ('am', 'pm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "sale_status" AS ENUM ('pagada', 'credito', 'apartado', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "closure_status" AS ENUM ('abierto', 'cerrado', 'perdido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Turno de secretarias
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS shift "shift";

-- Medidas corporales nuevas
ALTER TABLE body_measurements
  ADD COLUMN IF NOT EXISTS wrist_cm numeric(5,2),
  ADD COLUMN IF NOT EXISTS calf_cm  numeric(5,2),
  ADD COLUMN IF NOT EXISTS neck_cm  numeric(5,2),
  ADD COLUMN IF NOT EXISTS back_cm  numeric(5,2);

-- Productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  gym_id uuid NOT NULL REFERENCES gyms(id),
  name varchar(255) NOT NULL,
  category varchar(100),
  cost_price numeric(10,2) NOT NULL,
  sale_price numeric(10,2) NOT NULL,
  stock integer DEFAULT 0 NOT NULL,
  image_url varchar(1024),
  active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Ventas
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  gym_id uuid NOT NULL REFERENCES gyms(id),
  product_id uuid NOT NULL REFERENCES products(id),
  member_id uuid REFERENCES members(id),
  quantity integer DEFAULT 1 NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  amount_paid numeric(10,2) DEFAULT '0' NOT NULL,
  status "sale_status" DEFAULT 'pagada' NOT NULL,
  shift "shift",
  sold_by uuid REFERENCES system_users(id),
  sale_date timestamp DEFAULT now() NOT NULL,
  notes text
);

-- Abonos
CREATE TABLE IF NOT EXISTS sale_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_date timestamp DEFAULT now() NOT NULL,
  registered_by uuid REFERENCES system_users(id),
  notes text
);

-- Cierres de turno
CREATE TABLE IF NOT EXISTS shift_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  gym_id uuid NOT NULL REFERENCES gyms(id),
  user_id uuid NOT NULL REFERENCES system_users(id),
  shift "shift" NOT NULL,
  closure_date date NOT NULL,
  opening_confirmed_at timestamp,
  closed_at timestamp,
  status "closure_status" DEFAULT 'abierto' NOT NULL,
  sales_total numeric(10,2) DEFAULT '0' NOT NULL,
  counted_cash numeric(10,2),
  stock_ok boolean,
  discrepancies text,
  notes text,
  CONSTRAINT shift_closures_unique UNIQUE (gym_id, user_id, closure_date, shift)
);

-- Verificación
SELECT 'products' AS tabla, count(*) FROM products
UNION ALL SELECT 'sales', count(*) FROM sales
UNION ALL SELECT 'sale_payments', count(*) FROM sale_payments
UNION ALL SELECT 'shift_closures', count(*) FROM shift_closures;
