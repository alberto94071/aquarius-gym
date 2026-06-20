"use server";

import { db } from "@/db";
import { members, gyms, systemUsers, payments, pushSubscriptions, memberNotifications, memberRoutines, workoutSessions, bodyMeasurements } from "@/db/schema";
import { eq, desc, ilike, or, and, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { calculateMemberStatus } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

export async function createMember(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  
  let targetGymId = currentUser.gymId;
  if (currentUser.role === "admin") {
    const selectedGym = formData.get("gymId") as string;
    if (selectedGym) targetGymId = selectedGym;
  }
  
  if (!targetGymId) throw new Error("No se pudo determinar la sede");

  const [gym] = await db.select().from(gyms).where(eq(gyms.id, targetGymId));
  if (!gym) throw new Error("Sede no encontrada");

  const groupStr = "0000";
  const seqStr = String(gym.nextMemberSeq).padStart(4, '0');
  const memberCode = `${gym.codePrefix}-${groupStr}-${seqStr}`;

  const plan = formData.get("plan") as "mensual" | "trimestral" | "anual";

  // Allow custom start date (for registering past months)
  const startDateStr = formData.get("membershipStart") as string;
  const startDate = startDateStr ? new Date(startDateStr + "T12:00:00") : new Date();

  let endDate = new Date(startDate);
  if (plan === "mensual") endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  else if (plan === "trimestral") endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
  else if (plan === "anual") endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), 0);

  const price = formData.get("price") as string;
  const enrollmentFee = formData.get("enrollmentFee") as string || "0";
  const cardFee = formData.get("cardFee") as string || "0";
  const totalAmount = (Number(price) + Number(enrollmentFee) + Number(cardFee)).toString();
  const hasPaid = formData.get("paid") === "true";
  const paymentMethod = formData.get("paymentMethod") as any || null;

  const plainPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const [insertedMember] = await db.insert(members).values({
    code: memberCode,
    gymId: gym.id,
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || "sin_correo@olimpo.com",
    birthDate: formData.get("birthDate") as string,
    sex: formData.get("sex") as "M" | "F",
    plan: plan,
    price: price,
    membershipStart: startDate.toISOString().split("T")[0],
    membershipEnd: endDate.toISOString().split("T")[0],
    status: calculateMemberStatus(endDate.toISOString().split("T")[0]),
    paid: calculateMemberStatus(endDate.toISOString().split("T")[0]) === "activo" ? hasPaid : false,
    paymentMethod: paymentMethod,
    photoUrl: (formData.get("photoUrl") as string) || null,
    password: hashedPassword,
    address: (formData.get("address") as string) || null,
    emergencyContactName: (formData.get("emergencyContactName") as string) || null,
    emergencyContactPhone: (formData.get("emergencyContactPhone") as string) || null,
    emergencyContactRelation: (formData.get("emergencyContactRelation") as string) || null,
    registeredBy: currentUser.id,
  }).returning();

  if (hasPaid) {
    const today = new Date();
    await db.insert(payments).values({
      gymId: gym.id,
      memberId: insertedMember.id,
      monthlyAmount: price,
      enrollmentAmount: enrollmentFee,
      cardAmount: cardFee,
      amount: totalAmount,
      paymentDate: today.toISOString().split("T")[0],
      paymentMethod: paymentMethod,
      periodStart: startDate.toISOString().split("T")[0],
      periodEnd: endDate.toISOString().split("T")[0],
      registeredBy: currentUser.id,
      notes: "Primer pago de inscripción",
    });
  }

  await db.update(gyms)
    .set({ nextMemberSeq: gym.nextMemberSeq + 1 })
    .where(eq(gyms.id, gym.id));

  revalidatePath("/members");
  return { success: true, code: memberCode, password: plainPassword };
}

export async function resetMemberPassword(memberId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const plainPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await db.update(members)
    .set({ password: hashedPassword })
    .where(eq(members.id, memberId));

  revalidatePath(`/members/${memberId}`);
  return { password: plainPassword };
}

export async function getMembers(params?: { searchQuery?: string, statusFilter?: string, gymIdFilter?: string, limit?: number, offset?: number }) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  
  const conditions = [];
  if (currentUser.role !== "admin") {
    conditions.push(eq(members.gymId, currentUser.gymId!));
  } else if (params?.gymIdFilter) {
    conditions.push(eq(members.gymId, params.gymIdFilter));
  }

  if (params?.searchQuery) {
    conditions.push(or(ilike(members.name, `%${params.searchQuery}%`), ilike(members.code, `%${params.searchQuery}%`))!);
  }
  if (params?.statusFilter && params.statusFilter !== "todos") {
    conditions.push(eq(members.status, params.statusFilter as any));
  }

  // Get total count
  const countQuery = db.select({ count: sql`count(*)` }).from(members);
  if (conditions.length > 0) countQuery.where(and(...conditions));
  const [countRes] = await countQuery;
  const totalCount = Number(countRes?.count || 0);

  // Get paginated data
  const query = db.select({
      member: members,
      gymPrefix: gyms.codePrefix,
    })
    .from(members)
    .innerJoin(gyms, eq(members.gymId, gyms.id));
    
  if (conditions.length > 0) query.where(and(...conditions));
  
  query.orderBy(desc(members.createdAt));

  if (params?.limit) query.limit(params.limit);
  if (params?.offset) query.offset(params.offset);

  const data = await query;

  return {
    data: data.map(d => ({ ...d.member, gymPrefix: d.gymPrefix })),
    totalCount
  };
}

export async function getMemberById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [member] = await db.select({
    member: members,
    gymPrefix: gyms.codePrefix,
    gymName: gyms.name,
    enrollmentFee: gyms.enrollmentFee,
  })
  .from(members)
  .innerJoin(gyms, eq(members.gymId, gyms.id))
  .where(eq(members.id, id));

  if (!member) return null;

  const paymentHistory = await db.select()
    .from(payments)
    .where(eq(payments.memberId, id))
    .orderBy(desc(payments.paymentDate));

  return {
    ...member.member,
    gymPrefix: member.gymPrefix,
    gymName: member.gymName,
    enrollmentFee: member.enrollmentFee,
    payments: paymentHistory
  };
}

export async function updateMember(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  if (currentUser.role === "coach") throw new Error("Sin permiso");

  const [member] = await db.select().from(members).where(eq(members.id, id));
  if (!member) throw new Error("Miembro no encontrado");

  // Personal fields — all roles can update
  const baseFields: Record<string, unknown> = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || "sin_correo@olimpo.com",
    birthDate: formData.get("birthDate") as string,
    sex: formData.get("sex") as "M" | "F",
    address: (formData.get("address") as string) || null,
    emergencyContactName: (formData.get("emergencyContactName") as string) || null,
    emergencyContactPhone: (formData.get("emergencyContactPhone") as string) || null,
    emergencyContactRelation: (formData.get("emergencyContactRelation") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };

  // Financial/membership fields — admin only
  if (currentUser.role === "admin") {
    const plan = formData.get("plan") as "mensual" | "trimestral" | "anual";
    const price = formData.get("price") as string;
    const start = formData.get("membershipStart") as string;
    const end = formData.get("membershipEnd") as string;

    baseFields.plan = plan;
    baseFields.price = price;
    baseFields.membershipStart = start;
    baseFields.membershipEnd = end;
    if (end) {
      const calculatedStatus = calculateMemberStatus(end);
      baseFields.status = calculatedStatus;
      baseFields.paid = calculatedStatus === "activo";
    }
  }

  await db.update(members).set(baseFields as any).where(eq(members.id, id));

  revalidatePath(`/members/${id}`);
  revalidatePath("/members");
  return { success: true };
}

export async function deleteMember(memberId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  if (currentUser.role !== "admin") throw new Error("Solo el administrador puede eliminar miembros");

  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member) throw new Error("Miembro no encontrado");

  // ── Revertir secuencia del gym si es el último miembro (mismo número de seq) ──
  const [gym] = await db.select().from(gyms).where(eq(gyms.id, member.gymId));
  // Extract seq number from code (format: PREFIX-0000-NNNN)
  const seqPart = member.code.split("-")[2];
  const memberSeq = seqPart ? parseInt(seqPart, 10) : null;
  // Only decrement if this member's seq equals nextMemberSeq - 1 (i.e., it was the last one created)
  if (gym && memberSeq !== null && gym.nextMemberSeq - 1 === memberSeq) {
    await db.update(gyms).set({ nextMemberSeq: gym.nextMemberSeq - 1 }).where(eq(gyms.id, gym.id));
  }

  // ── Delete related data in order (FK constraints) ──
  // 1. Workout set logs (cascade from sessions, but delete sessions explicitly)
  const sessions = await db.select({ id: workoutSessions.id }).from(workoutSessions).where(eq(workoutSessions.memberId, memberId));
  if (sessions.length > 0) {
    // workoutSetLogs cascade on session delete
    await db.delete(workoutSessions).where(eq(workoutSessions.memberId, memberId));
  }
  // 2. Member routines
  await db.delete(memberRoutines).where(eq(memberRoutines.memberId, memberId));
  // 3. Body measurements
  await db.delete(bodyMeasurements).where(eq(bodyMeasurements.memberId, memberId));
  // 4. Push subscriptions
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.memberId, memberId));
  // 5. Member notifications
  await db.delete(memberNotifications).where(eq(memberNotifications.memberId, memberId));
  // 6. Payments (nullify memberId to preserve accounting history)
  await db.update(payments).set({ memberId: null }).where(eq(payments.memberId, memberId));
  // 7. Remove from group if applicable
  if (member.groupId) {
    await db.update(members).set({ groupId: null, isRepresentative: false }).where(eq(members.id, memberId));
  }
  // 8. Delete member
  await db.delete(members).where(eq(members.id, memberId));

  revalidatePath("/members");
  revalidatePath("/dashboard");
  redirect("/members");
}

export async function updateMemberPhoto(id: string, photoUrl: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await db.update(members)
    .set({ photoUrl })
    .where(eq(members.id, id));

  revalidatePath(`/members/${id}`);
  revalidatePath("/members");
  return { success: true };
}
