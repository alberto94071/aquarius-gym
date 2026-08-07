import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  date,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
// "secretaria" es el rol genérico (la sede se determina por gymId);
// secretaria_rb / secretaria_sb se conservan por compatibilidad con datos antiguos.
export const roleEnum = pgEnum("role", ["admin", "secretaria", "secretaria_rb", "secretaria_sb", "coach"]);
// Turno del personal: mañana o tarde
export const shiftEnum = pgEnum("shift", ["am", "pm"]);
export const sexEnum = pgEnum("sex", ["M", "F"]);
// "anual" se conserva en el enum por compatibilidad pero ya no se ofrece
// (el negocio no maneja plan anual); los planes reales son estos 4.
export const planEnum = pgEnum("plan", ["semanal", "quincenal", "mensual", "trimestral", "anual"]);
// Nivel de acceso: básico o VIP (incluye el área del 4to. nivel)
export const accessLevelEnum = pgEnum("access_level", ["basico", "vip"]);
export const statusEnum = pgEnum("status", ["activo", "mora", "vencido", "bloqueado"]);
export const paymentMethodEnum = pgEnum("payment_method", ["efectivo", "transferencia"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "payment_reminder",
  "motivation",
  "birthday",
  "group_reminder",
  "custom",
  "announcement",
]);
export const channelEnum = pgEnum("channel", ["push", "whatsapp", "email"]);

// Gyms (Sedes)
export const gyms = pgTable("gyms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  codePrefix: varchar("code_prefix", { length: 10 }).notNull(),
  address: varchar("address", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  schedule: text("schedule"),
  photoUrl: varchar("photo_url", { length: 1024 }),
  // Mensual — básico y VIP (área 4to. nivel)
  pricingMonthly: decimal("pricing_monthly", { precision: 10, scale: 2 }).notNull(), // básico
  pricingMonthlyVip: decimal("pricing_monthly_vip", { precision: 10, scale: 2 }),
  // Trimestral — SOLO existe en VIP ("Súper PROMO VIP", 3 meses anticipados)
  pricingQuarterly: decimal("pricing_quarterly", { precision: 10, scale: 2 }),
  pricingAnnual: decimal("pricing_annual", { precision: 10, scale: 2 }), // sin uso; el negocio no ofrece plan anual
  // Semanal (inicia lunes, vence sábado) — básico y VIP
  pricingWeeklyBasico: decimal("pricing_weekly_basico", { precision: 10, scale: 2 }),
  pricingWeeklyVip: decimal("pricing_weekly_vip", { precision: 10, scale: 2 }),
  // Quincenal (15 días corridos desde la inscripción) — básico y VIP
  pricingBiweeklyBasico: decimal("pricing_biweekly_basico", { precision: 10, scale: 2 }),
  pricingBiweeklyVip: decimal("pricing_biweekly_vip", { precision: 10, scale: 2 }),
  pricingGroupDefault: decimal("pricing_group_default", { precision: 10, scale: 2 }).notNull(),
  enrollmentFee: decimal("enrollment_fee", { precision: 10, scale: 2 }).default("0").notNull(),
  cardFee: decimal("card_fee", { precision: 10, scale: 2 }).default("0").notNull(),
  // Pago por visita/sesión (sin membresía) — básico y VIP
  pricingDayPass: decimal("pricing_day_pass", { precision: 10, scale: 2 }).default("15").notNull(), // básico
  pricingDayPassVip: decimal("pricing_day_pass_vip", { precision: 10, scale: 2 }),
  // Horarios de turnos de ESTA sede (hora 0-23, configurables por el admin)
  shiftAmStart: integer("shift_am_start").default(6).notNull(),
  shiftAmEnd: integer("shift_am_end").default(13).notNull(),
  shiftPmStart: integer("shift_pm_start").default(13).notNull(),
  shiftPmEnd: integer("shift_pm_end").default(21).notNull(),
  nextMemberSeq: integer("next_member_seq").default(1).notNull(),
  nextGroupSeq: integer("next_group_seq").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System Users (Admin Panel Users)
export const systemUsers = pgTable("system_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: roleEnum("role").notNull(),
  shift: shiftEnum("shift"), // turno de secretarias (am/pm); null para admin
  password: varchar("password", { length: 255 }), // Nullable because Google users might not have one
  gymId: uuid("gym_id").references(() => gyms.id),
  avatarUrl: varchar("avatar_url", { length: 1024 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Groups
export const groups = pgTable(
  "groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gymId: uuid("gym_id").references(() => gyms.id).notNull(),
    groupNumber: integer("group_number").notNull(),
    representativeId: uuid("representative_id"), // FK to members, added dynamically or using relations
    pricePerPerson: decimal("price_per_person", { precision: 10, scale: 2 }).notNull(),
    paidFull: boolean("paid_full").default(false).notNull(),
    lastPaymentDate: date("last_payment_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    unq: unique().on(t.gymId, t.groupNumber),
  })
);

// Members
export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  gymId: uuid("gym_id").references(() => gyms.id).notNull(),
  groupId: uuid("group_id").references(() => groups.id),
  isRepresentative: boolean("is_representative").default(false).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  birthDate: date("birth_date").notNull(),
  sex: sexEnum("sex").notNull(),
  plan: planEnum("plan").notNull(),
  accessLevel: accessLevelEnum("access_level").default("basico").notNull(), // básico o VIP (4to. nivel)
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  membershipStart: date("membership_start").notNull(),
  membershipEnd: date("membership_end").notNull(),
  status: statusEnum("status").default("activo").notNull(),
  paid: boolean("paid").default(false).notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  lastVisit: date("last_visit"),
  photoUrl: varchar("photo_url", { length: 1024 }),
  password: varchar("password", { length: 255 }),
  notes: text("notes"),
  address: varchar("address", { length: 500 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
  emergencyContactRelation: varchar("emergency_contact_relation", { length: 100 }),
  fingerprintTemplate: text("fingerprint_template"), // template del lector HID (base64), capturado al inscribir
  termsAcceptedVersion: integer("terms_accepted_version"), // versión de legal_documents que aceptó
  termsAcceptedAt: timestamp("terms_accepted_at"),
  registeredBy: uuid("registered_by").references(() => systemUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  gymId: uuid("gym_id").references(() => gyms.id).notNull(),
  memberId: uuid("member_id").references(() => members.id),
  groupId: uuid("group_id").references(() => groups.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Total pagado
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  enrollmentAmount: decimal("enrollment_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  cardAmount: decimal("card_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  reference: varchar("reference", { length: 255 }),
  registeredBy: uuid("registered_by").references(() => systemUsers.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Announcements
export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  gymId: uuid("gym_id").references(() => gyms.id),
  imageUrl: varchar("image_url", { length: 1024 }),
  sendPush: boolean("send_push").default(false).notNull(),
  published: boolean("published").default(true).notNull(),
  pinned: boolean("pinned").default(false).notNull(),
  createdBy: uuid("created_by").references(() => systemUsers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }),
  message: text("message").notNull(),
  gymId: uuid("gym_id").references(() => gyms.id),
  targetMemberId: uuid("target_member_id").references(() => members.id),
  targetGroupId: uuid("target_group_id").references(() => groups.id),
  channel: channelEnum("channel").notNull(),
  sentAt: timestamp("sent_at"),
  sentBy: uuid("sent_by").references(() => systemUsers.id),
  deliveredCount: integer("delivered_count").default(0).notNull(),
});

// Push Subscriptions (Expo Push Tokens)
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").references(() => members.id).notNull(),
  expoPushToken: varchar("expo_push_token", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 20 }), // "android" | "ios"
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Member Notifications (inbox)
export const memberNotifications = pgTable("member_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").references(() => members.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  read: boolean("read").default(false).notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// Relations
export const groupsRelations = relations(groups, ({ one }) => ({
  representative: one(members, {
    fields: [groups.representativeId],
    references: [members.id],
  }),
}));

// ─── Fitness / Routines ──────────────────────────────────────────────────────

export const muscleGroupEnum = pgEnum("muscle_group", [
  "pecho", "espalda", "hombros", "biceps", "triceps",
  "piernas", "gluteos", "core", "cardio", "full_body",
]);

export const contentTypeEnum = pgEnum("content_type", ["video", "article", "tip", "image", "notice"]);

// Exercise bank
export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  gymId: uuid("gym_id").references(() => gyms.id),
  name: varchar("name", { length: 255 }).notNull(),
  muscleGroup: muscleGroupEnum("muscle_group").notNull(),
  defaultSets: varchar("default_sets", { length: 50 }).default("3 x 10-12"),
  defaultRest: varchar("default_rest", { length: 50 }).default("2 min"),
  notes: text("notes"),
  imageUrl: varchar("image_url", { length: 1024 }),
  videoUrl: varchar("video_url", { length: 1024 }),
  createdBy: uuid("created_by").references(() => systemUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Routine templates — compartidas entre las 3 sedes (igual que el banco de
// ejercicios); gymId solo queda como referencia informativa de quién la creó.
export const routines = pgTable("routines", {
  id: uuid("id").defaultRandom().primaryKey(),
  gymId: uuid("gym_id").references(() => gyms.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  dayLabel: varchar("day_label", { length: 100 }),
  createdBy: uuid("created_by").references(() => systemUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exercises inside a routine (ordered)
export const routineExercises = pgTable("routine_exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  routineId: uuid("routine_id")
    .references(() => routines.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: uuid("exercise_id").references(() => exercises.id).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  sets: varchar("sets", { length: 50 }),
  rest: varchar("rest", { length: 50 }),
  notes: text("notes"),
});

// Routine assigned to a member
export const memberRoutines = pgTable("member_routines", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").references(() => members.id).notNull(),
  routineId: uuid("routine_id").references(() => routines.id).notNull(),
  assignedBy: uuid("assigned_by").references(() => systemUsers.id),
  assignedAt: date("assigned_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// A single workout session for a member
export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").references(() => members.id).notNull(),
  routineId: uuid("routine_id").references(() => routines.id).notNull(),
  sessionDate: date("session_date").notNull(),
  currentPhase: varchar("current_phase", { length: 20 }).default("warmup").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Individual set logs within a session
export const workoutSetLogs = pgTable("workout_set_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => workoutSessions.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: uuid("exercise_id").references(() => exercises.id).notNull(),
  setIndex: integer("set_index").notNull(),
  weight: varchar("weight", { length: 50 }),
  reps: varchar("reps", { length: 50 }),
  completed: boolean("completed").default(false).notNull(),
});

// Body measurements logged by member (siempre almacenadas en cm; la app convierte de pulgadas)
export const bodyMeasurements = pgTable("body_measurements", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").references(() => members.id).notNull(),
  logDate: date("log_date").notNull(),
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
  waistCm: decimal("waist_cm", { precision: 5, scale: 2 }),
  chestCm: decimal("chest_cm", { precision: 5, scale: 2 }),
  hipsCm: decimal("hips_cm", { precision: 5, scale: 2 }),
  armCm: decimal("arm_cm", { precision: 5, scale: 2 }),
  wristCm: decimal("wrist_cm", { precision: 5, scale: 2 }),
  calfCm: decimal("calf_cm", { precision: 5, scale: 2 }),
  neckCm: decimal("neck_cm", { precision: 5, scale: 2 }),
  backCm: decimal("back_cm", { precision: 5, scale: 2 }),
  notes: text("notes"), // "Objetivo personal" del miembro
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Ventas / Inventario ─────────────────────────────────────────────────────

export const saleStatusEnum = pgEnum("sale_status", ["pagada", "credito", "apartado", "cancelada"]);
export const closureStatusEnum = pgEnum("closure_status", ["abierto", "cerrado", "perdido"]);

// Productos del inventario (aguas, gatorades, proteína, suplementos...)
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  gymId: uuid("gym_id").references(() => gyms.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(), // a cuánto se compró
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(), // a cuánto se vende
  stock: integer("stock").default(0).notNull(),
  imageUrl: varchar("image_url", { length: 1024 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ventas (contado, crédito a miembro, o apartado desde la app)
// Preferencia de pago que el miembro expresa al apartar desde la app (solo
// informativo para el personal — el cobro real siempre lo registra el staff
// en la sede; la app no procesa pagos).
export const salePaymentIntentEnum = pgEnum("sale_payment_intent", ["luego", "abono", "mensualidad"]);

export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  gymId: uuid("gym_id").references(() => gyms.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  memberId: uuid("member_id").references(() => members.id), // null = cliente de mostrador
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0").notNull(),
  status: saleStatusEnum("status").default("pagada").notNull(),
  shift: shiftEnum("shift"), // turno en que se registró (para el cuadre)
  soldBy: uuid("sold_by").references(() => systemUsers.id), // null = pedido desde la app
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  notes: text("notes"),
  paymentIntent: salePaymentIntentEnum("payment_intent").default("luego").notNull(),
  intendedAmount: decimal("intended_amount", { precision: 10, scale: 2 }), // lo que el miembro dijo que abonaría (declarado, no cobrado)
});

// Abonos a una venta (pagos parciales)
export const salePayments = pgTable("sale_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id").references(() => sales.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  registeredBy: uuid("registered_by").references(() => systemUsers.id),
  notes: text("notes"),
});

// Pagos por día (usuarios sin membresía que pagan solo un día de gimnasio)
export const dayPasses = pgTable("day_passes", {
  id: uuid("id").defaultRandom().primaryKey(),
  gymId: uuid("gym_id").references(() => gyms.id).notNull(),
  personName: varchar("person_name", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  accessLevel: accessLevelEnum("access_level").default("basico").notNull(),
  shift: shiftEnum("shift"),
  soldBy: uuid("sold_by").references(() => systemUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pausas de membresía ("no se repone tiempo, salvo aviso con causa justificada").
// Extienden membershipEnd por los días pausados; queda el motivo y comprobante
// (ej. receta médica) en el historial.
export const memberPauses = pgTable("member_pauses", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").references(() => members.id).notNull(),
  days: integer("days").notNull(),
  reason: text("reason").notNull(),
  proofUrl: varchar("proof_url", { length: 1024 }), // foto opcional del comprobante/receta
  previousEnd: date("previous_end").notNull(),
  newEnd: date("new_end").notNull(),
  registeredBy: uuid("registered_by").references(() => systemUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Asistencias (check-in por huella con lector HID, o manual)
export const attendanceSourceEnum = pgEnum("attendance_source", ["huella", "manual"]);
export const attendances = pgTable("attendances", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").references(() => members.id).notNull(),
  gymId: uuid("gym_id").references(() => gyms.id).notNull(),
  checkinAt: timestamp("checkin_at").defaultNow().notNull(),
  source: attendanceSourceEnum("source").default("huella").notNull(),
});

// Cuadre/cierre de turno de las secretarias
export const shiftClosures = pgTable(
  "shift_closures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gymId: uuid("gym_id").references(() => gyms.id).notNull(),
    userId: uuid("user_id").references(() => systemUsers.id).notNull(),
    shift: shiftEnum("shift").notNull(),
    closureDate: date("closure_date").notNull(),
    openingConfirmedAt: timestamp("opening_confirmed_at"), // confirmó inventario al llegar
    closedAt: timestamp("closed_at"),
    status: closureStatusEnum("status").default("abierto").notNull(),
    salesTotal: decimal("sales_total", { precision: 10, scale: 2 }).default("0").notNull(),
    countedCash: decimal("counted_cash", { precision: 10, scale: 2 }), // efectivo contado al cierre
    stockOk: boolean("stock_ok"), // el inventario físico cuadró
    discrepancies: text("discrepancies"), // detalle de faltantes (los repone la secretaria)
    notes: text("notes"),
  },
  (t) => ({
    unq: unique().on(t.gymId, t.userId, t.closureDate, t.shift),
  })
);

// Home screen content (videos, articles, tips, images)
export const homeContent = pgTable("home_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  gymId: uuid("gym_id").references(() => gyms.id),
  type: contentTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  url: varchar("url", { length: 1024 }),
  imageUrl: varchar("image_url", { length: 1024 }),
  published: boolean("published").default(true).notNull(),
  pinned: boolean("pinned").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdBy: uuid("created_by").references(() => systemUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Documento legal (Términos de Uso y Consentimiento de Riesgo) ────────────
// Historial versionado: cada publicación inserta una fila nueva. La versión
// más alta es la vigente; los miembros deben (re)aceptarla si la suya quedó
// atrás. NUNCA se editan filas existentes — así queda el registro legal de
// qué texto exacto aceptó cada miembro y cuándo.
export const legalDocuments = pgTable("legal_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  version: integer("version").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  contentHtml: text("content_html").notNull(),
  publishedBy: uuid("published_by").references(() => systemUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
