export type MemberStatus = "activo" | "mora" | "vencido" | "bloqueado";
export type Plan = "semanal" | "quincenal" | "mensual" | "trimestral" | "anual";
export type AccessLevel = "basico" | "vip";
export type MuscleGroup = "pecho" | "espalda" | "hombros" | "biceps" | "triceps" | "piernas" | "gluteos" | "core" | "cardio" | "full_body";

export interface Gym {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  schedule?: string | null;
}

export interface Group {
  id: string;
  groupNumber: number;
  repName: string | null;
  repPhone: string | null;
  paidFull: boolean;
  memberCount: number;
}

export interface Payment {
  id: string;
  amount: string;
  date: string;
  method: "efectivo" | "transferencia";
  notes?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
}

export interface Member {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  sex: "M" | "F";
  photoUrl?: string | null;
  gym: Gym;
  plan: Plan;
  accessLevel: AccessLevel;
  price: string;
  membershipStart: string;
  membershipEnd: string;
  daysRemaining: number;
  status: MemberStatus;
  paid: boolean;
  group: Group | null;
  paymentHistory: Payment[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  gymName?: string | null;
  pinned: boolean;
  createdAt: string;
}

export interface MemberNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  sentAt: string;
}

export interface AuthMember {
  id: string;
  name: string;
  code: string;
  gym: { id: string; name: string | null };
  status: MemberStatus;
  photoUrl?: string | null;
}

// ─── Fitness / Routines ──────────────────────────────────────────────────────

export interface RoutineExercise {
  routineExerciseId: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: string;
  rest: string;
  notes: string;
  imageUrl: string | null;
  videoUrl: string | null;
  sortOrder: number;
}

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  dayLabel: string | null;
  exercises: RoutineExercise[];
}

export interface SetLog {
  exerciseId: string;
  setIndex: number;
  weight: string;
  reps: string;
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  sessionDate: string;
  currentPhase: "warmup" | "exercise" | "stretch";
  completedAt: string | null;
  setLogs: SetLog[];
}

// ─── Home Content ─────────────────────────────────────────────────────────────

export interface HomeContentItem {
  id: string;
  type: "video" | "article" | "tip" | "image" | "notice";
  title: string;
  body: string | null;
  url: string | null;
  imageUrl: string | null;
  pinned: boolean;
  sortOrder: number;
}
