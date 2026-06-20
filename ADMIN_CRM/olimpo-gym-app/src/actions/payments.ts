"use server";

import { db } from "@/db";
import { members, payments, systemUsers, groups, gyms } from "@/db/schema";
import { eq, ilike, or, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { calculateMemberStatus } from "@/lib/utils";

/** Returns members in mora (for default payment list) */
export async function getMoraMembers(gymFilter?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));

  const conditions = [eq(members.status, "mora")];
  if (currentUser.role !== "admin") {
    conditions.push(eq(members.gymId, currentUser.gymId!));
  } else if (gymFilter) {
    conditions.push(eq(members.gymId, gymFilter));
  }

  return db.select().from(members).where(and(...conditions)).orderBy(members.membershipEnd).limit(50);
}

export async function searchMembersForPayment(query: string, gymFilter?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));

  const conditions = [];
  if (currentUser.role !== "admin") {
    conditions.push(eq(members.gymId, currentUser.gymId!));
  } else if (gymFilter) {
    conditions.push(eq(members.gymId, gymFilter));
  }

  if (query) {
    conditions.push(or(ilike(members.name, `%${query}%`), ilike(members.code, `%${query}%`))!);
  }

  const dbQuery = db.select().from(members);
  if (conditions.length > 0) dbQuery.where(and(...conditions));
  
  // limit to 20 to avoid huge payloads
  dbQuery.limit(20);

  return await dbQuery;
}

/** Returns all YYYY-MM keys already paid for a member */
export async function getMemberPaidMonths(memberId: string): Promise<string[]> {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const paymentHistory = await db
    .select({ periodStart: payments.periodStart, periodEnd: payments.periodEnd })
    .from(payments)
    .where(eq(payments.memberId, memberId));

  const paid: string[] = [];
  for (const p of paymentHistory) {
    if (!p.periodStart || !p.periodEnd) continue;
    const d1 = new Date(p.periodStart + "T00:00:00");
    const d2 = new Date(p.periodEnd + "T00:00:00");
    const c = new Date(d1.getFullYear(), d1.getMonth(), 1);
    while (c <= d2) {
      const k = `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}`;
      if (!paid.includes(k)) paid.push(k);
      c.setMonth(c.getMonth() + 1);
    }
  }
  return paid;
}

export async function registerPayment(data: {
  memberId: string;
  paymentType: "mensualidad" | "reposicion_carne";
  paymentMonth?: string;
  amount: string;
  paymentMethod: "efectivo" | "transferencia";
  notes?: string;
  forceConfirm?: boolean; // true = bypass past-month warning (user confirmed)
}) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));

  const [member] = await db.select().from(members).where(eq(members.id, data.memberId));
  if (!member) throw new Error("Miembro no encontrado");

  const today = new Date();
  let newEndDate = new Date(member.membershipEnd);

  if (data.paymentType === "mensualidad" && data.paymentMonth) {
    const [yyyy, mm] = data.paymentMonth.split("-").map(Number);
    // Last day of selected month
    newEndDate = new Date(yyyy, mm, 0);

    // ── Guard: already paid check using actual payment history ──────────
    const paidMonths = await getMemberPaidMonths(data.memberId);
    const key = `${yyyy}-${String(mm).padStart(2, "0")}`;
    if (paidMonths.includes(key)) {
      const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      throw new Error(
        `${MONTHS_ES[mm - 1]} ${yyyy} ya está pagado para este miembro. Selecciona otro mes.`
      );
    }

    // ── Past-month warning (server-side) ────────────────────────────────
    // We only apply this guard if forceConfirm is NOT set
    const selectedMonthIsPast =
      yyyy < today.getFullYear() ||
      (yyyy === today.getFullYear() && mm < today.getMonth() + 1);

    if (selectedMonthIsPast && !data.forceConfirm) {
      const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      // Return a special error code so the client can show a confirmation dialog
      throw new Error(`CONFIRM_PAST_MONTH:${MONTHS_ES[mm - 1]} ${yyyy} es un mes pasado. ¿Confirmas que deseas registrar este pago?`);
    }
    // ────────────────────────────────────────────────────────────────────

    // If the new end date is LATER than current membershipEnd, extend it
    const currentEnd = new Date(member.membershipEnd + "T00:00:00");
    const finalEnd = newEndDate > currentEnd ? newEndDate : currentEnd;
    const finalEndStr = finalEnd.toISOString().split("T")[0];
    const calculatedStatus = calculateMemberStatus(finalEndStr);

    await db.update(members)
      .set({
        membershipEnd: finalEndStr,
        status: calculatedStatus,
        paid: calculatedStatus === "activo",
      })
      .where(eq(members.id, member.id));

    // Extend group members if representative
    if (member.groupId && member.isRepresentative) {
      await db.update(members)
        .set({
          membershipEnd: finalEndStr,
          status: calculatedStatus,
          paid: calculatedStatus === "activo",
        })
        .where(eq(members.groupId, member.groupId));

      await db.update(groups)
        .set({ paidFull: calculatedStatus === "activo" })
        .where(eq(groups.id, member.groupId));
    }

    // Use the actual start of the selected month as periodStart
    const periodStart = new Date(yyyy, mm - 1, 1).toISOString().split("T")[0];

    await db.insert(payments).values({
      gymId: member.gymId,
      memberId: member.id,
      groupId: member.groupId,
      amount: data.amount,
      monthlyAmount: data.amount,
      cardAmount: "0",
      paymentDate: today.toISOString().split("T")[0],
      paymentMethod: data.paymentMethod,
      periodStart,
      periodEnd: newEndDate.toISOString().split("T")[0],
      registeredBy: currentUser.id,
      notes: data.notes || "Renovación de membresía",
    });
  } else {
    // reposicion_carne or other types without month
    await db.insert(payments).values({
      gymId: member.gymId,
      memberId: member.id,
      groupId: member.groupId,
      amount: data.amount,
      monthlyAmount: "0",
      cardAmount: data.paymentType === "reposicion_carne" ? data.amount : "0",
      paymentDate: today.toISOString().split("T")[0],
      paymentMethod: data.paymentMethod,
      periodStart: null,
      periodEnd: null,
      registeredBy: currentUser.id,
      notes: data.notes || "Reposición de carné",
    });
  }

  revalidatePath("/payments");
  revalidatePath("/members");
  revalidatePath("/groups");
  revalidatePath(`/members/${data.memberId}`);
  return { success: true };
}

export async function getGroupDetailsForPayment(groupId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) throw new Error("Grupo no encontrado");

  const groupMembers = await db.select().from(members).where(eq(members.groupId, groupId));
  
  // Calculate total monthly payment
  const totalAmount = groupMembers.reduce((sum, m) => sum + Number(m.price), 0);

  return {
    group,
    groupMembers,
    totalAmount: totalAmount.toString()
  };
}

export async function getMemberPaymentInfo(memberId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [row] = await db
    .select({ member: members, enrollmentFee: gyms.enrollmentFee })
    .from(members)
    .innerJoin(gyms, eq(members.gymId, gyms.id))
    .where(eq(members.id, memberId));

  if (!row) throw new Error("Miembro no encontrado");

  const recentPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.memberId, memberId))
    .orderBy(desc(payments.paymentDate))
    .limit(6);

  const today = new Date();
  const endDate = new Date(row.member.membershipEnd + "T00:00:00");

  // Next month to pay = month after membershipEnd
  const next = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1);
  const nextMonthToPay = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;

  // Days since membership expired (0 if still active)
  const daysOverdue = today > endDate
    ? Math.floor((today.getTime() - endDate.getTime()) / 86400000)
    : 0;

  // Charge enrollment fee if member has been away >270 days (~9 months)
  const chargeEnrollment = daysOverdue > 270;

  return {
    membershipEnd: row.member.membershipEnd,
    nextMonthToPay,
    daysOverdue,
    chargeEnrollment,
    enrollmentFee: row.enrollmentFee,
    recentPayments,
  };
}
