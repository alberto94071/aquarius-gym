-- ═══════════════════════════════════════════════════════════════════
-- SETUP COMPLETO — Aquarius Gym (base de datos desde cero)
-- Pegar y ejecutar en: Neon Console → tu proyecto → SQL Editor
-- Crea todas las tablas, las 3 sedes y los usuarios admin.
-- Contraseña inicial de los admins: la ADMIN_INITIAL_PASSWORD acordada
-- (cámbiala después de entrar al panel).
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE "public"."channel" AS ENUM('push', 'whatsapp', 'email');
CREATE TYPE "public"."content_type" AS ENUM('video', 'article', 'tip', 'image', 'notice');
CREATE TYPE "public"."muscle_group" AS ENUM('pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'piernas', 'gluteos', 'core', 'cardio', 'full_body');
CREATE TYPE "public"."notification_type" AS ENUM('payment_reminder', 'motivation', 'birthday', 'group_reminder', 'custom', 'announcement');
CREATE TYPE "public"."payment_method" AS ENUM('efectivo', 'transferencia');
CREATE TYPE "public"."plan" AS ENUM('mensual', 'trimestral', 'anual');
CREATE TYPE "public"."role" AS ENUM('admin', 'secretaria', 'secretaria_rb', 'secretaria_sb', 'coach');
CREATE TYPE "public"."sex" AS ENUM('M', 'F');
CREATE TYPE "public"."status" AS ENUM('activo', 'mora', 'vencido', 'bloqueado');
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"gym_id" uuid,
	"image_url" varchar(1024),
	"send_push" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "body_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"weight_kg" numeric(5, 2),
	"waist_cm" numeric(5, 2),
	"chest_cm" numeric(5, 2),
	"hips_cm" numeric(5, 2),
	"arm_cm" numeric(5, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid,
	"name" varchar(255) NOT NULL,
	"muscle_group" "muscle_group" NOT NULL,
	"default_sets" varchar(50) DEFAULT '3 x 10-12',
	"default_rest" varchar(50) DEFAULT '2 min',
	"notes" text,
	"image_url" varchar(1024),
	"video_url" varchar(1024),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"group_number" integer NOT NULL,
	"representative_id" uuid,
	"price_per_person" numeric(10, 2) NOT NULL,
	"paid_full" boolean DEFAULT false NOT NULL,
	"last_payment_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groups_gym_id_group_number_unique" UNIQUE("gym_id","group_number")
);

CREATE TABLE "gyms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code_prefix" varchar(10) NOT NULL,
	"address" varchar(255),
	"phone" varchar(50),
	"schedule" text,
	"photo_url" varchar(1024),
	"pricing_monthly" numeric(10, 2) NOT NULL,
	"pricing_quarterly" numeric(10, 2),
	"pricing_annual" numeric(10, 2),
	"pricing_group_default" numeric(10, 2) NOT NULL,
	"enrollment_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"card_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"next_member_seq" integer DEFAULT 1 NOT NULL,
	"next_group_seq" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "home_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid,
	"type" "content_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"url" varchar(1024),
	"image_url" varchar(1024),
	"published" boolean DEFAULT true NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "member_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "member_routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"routine_id" uuid NOT NULL,
	"assigned_by" uuid,
	"assigned_at" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"gym_id" uuid NOT NULL,
	"group_id" uuid,
	"is_representative" boolean DEFAULT false NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"birth_date" date NOT NULL,
	"sex" "sex" NOT NULL,
	"plan" "plan" NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"membership_start" date NOT NULL,
	"membership_end" date NOT NULL,
	"status" "status" DEFAULT 'activo' NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"payment_method" "payment_method",
	"last_visit" date,
	"photo_url" varchar(1024),
	"password" varchar(255),
	"notes" text,
	"address" varchar(500),
	"emergency_contact_name" varchar(255),
	"emergency_contact_phone" varchar(50),
	"emergency_contact_relation" varchar(100),
	"registered_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "members_code_unique" UNIQUE("code")
);

CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255),
	"message" text NOT NULL,
	"gym_id" uuid,
	"target_member_id" uuid,
	"target_group_id" uuid,
	"channel" "channel" NOT NULL,
	"sent_at" timestamp,
	"sent_by" uuid,
	"delivered_count" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" uuid,
	"group_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"monthly_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"enrollment_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"card_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"period_start" date,
	"period_end" date,
	"reference" varchar(255),
	"registered_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"expo_push_token" varchar(255) NOT NULL,
	"platform" varchar(20),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"sets" varchar(50),
	"rest" varchar(50),
	"notes" text
);

CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"day_label" varchar(100),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "system_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" NOT NULL,
	"password" varchar(255),
	"gym_id" uuid,
	"avatar_url" varchar(1024),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_users_email_unique" UNIQUE("email")
);

CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"routine_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"current_phase" varchar(20) DEFAULT 'warmup' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "workout_set_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"set_index" integer NOT NULL,
	"weight" varchar(50),
	"reps" varchar(50),
	"completed" boolean DEFAULT false NOT NULL
);

ALTER TABLE "announcements" ADD CONSTRAINT "announcements_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "groups" ADD CONSTRAINT "groups_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "home_content" ADD CONSTRAINT "home_content_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "home_content" ADD CONSTRAINT "home_content_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "member_notifications" ADD CONSTRAINT "member_notifications_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "member_routines" ADD CONSTRAINT "member_routines_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "member_routines" ADD CONSTRAINT "member_routines_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "member_routines" ADD CONSTRAINT "member_routines_assigned_by_system_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "members" ADD CONSTRAINT "members_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "members" ADD CONSTRAINT "members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "members" ADD CONSTRAINT "members_registered_by_system_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_target_member_id_members_id_fk" FOREIGN KEY ("target_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_target_group_id_groups_id_fk" FOREIGN KEY ("target_group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sent_by_system_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_registered_by_system_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "routines" ADD CONSTRAINT "routines_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "routines" ADD CONSTRAINT "routines_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "system_users" ADD CONSTRAINT "system_users_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "workout_set_logs" ADD CONSTRAINT "workout_set_logs_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_set_logs" ADD CONSTRAINT "workout_set_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;

-- ── Sedes ────────────────────────────────────────────────────────────
INSERT INTO gyms (name, code_prefix, address, pricing_monthly, pricing_quarterly, pricing_annual, pricing_group_default) VALUES
  ('Aquarius Gym - Tacaná',     'AGTC', 'Tacaná, San Marcos',     150.00, 400.00, 1500.00, 100.00),
  ('Aquarius Gym - Cuilco',     'AGCU', 'Cuilco, Huehuetenango',  150.00, 400.00, 1500.00, 100.00),
  ('Aquarius Gym - San Marcos', 'AGSM', 'San Marcos, San Marcos', 150.00, 400.00, 1500.00, 100.00);

-- ── Usuarios admin (contraseña inicial: ver .env.local / cambiarla al entrar) ──
INSERT INTO system_users (email, name, role, password, active) VALUES
  ('admin@aquariusgym.com',    'Administrador Aquarius', 'admin', '$2b$10$iROLjKIJR5ahwFtwGEs8Butfbox.SqWPrlN4dGtZgVyazdWQwn6/e', true),
  ('alberto.94071@gmail.com',  'Alberto Admin',          'admin', '$2b$10$iROLjKIJR5ahwFtwGEs8Butfbox.SqWPrlN4dGtZgVyazdWQwn6/e', true)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, active = true;

-- ── Verificación ─────────────────────────────────────────────────────
SELECT name, code_prefix FROM gyms ORDER BY name;
