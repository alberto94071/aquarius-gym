"use server";

import { db } from "@/db";
import { members, payments, systemUsers, groups, gyms } from "@/db/schema";
import { eq, ilike, or, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

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

export async function registerPayment(data: {
  memberId: string;
  paymentType: "mensualidad" | "reposicion_carne";
  paymentMonth?: string;
  amount: string;
  paymentMethod: "efectivo" | "transferencia";
  notes?: string;
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
    // Last day of the selected month
    newEndDate = new Date(yyyy, mm, 0);

    // ── Guard: prevent paying a month already covered ──────────────────
    const currentEnd = new Date(member.membershipEnd + "T00:00:00");
    if (newEndDate <= currentEnd) {
      const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      throw new Error(
        `${MONTHS_ES[mm - 1]} ${yyyy} ya está pagado. ` +
        `La membresía vence el ${currentEnd.toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}. ` +
        `Selecciona un mes posterior.`
      );
    }
    // ───────────────────────────────────────────────────────────────────

    await db.update(members)
      .set({
        membershipEnd: newEndDate.toISOString().split("T")[0],
        status: "activo",
        paid: true,
      })
      .where(eq(members.id, member.id));

    // If representative of a group, extend all group members too
    if (member.groupId && member.isRepresentative) {
      await db.update(members)
        .set({
          membershipEnd: newEndDate.toISOString().split("T")[0],
          status: "activo",
          paid: true,
        })
        .where(eq(members.groupId, member.groupId));

      await db.update(groups)
        .set({ paidFull: true })
        .where(eq(groups.id, member.groupId));
    }
  }

  await db.insert(payments).values({
    gymId: member.gymId,
    memberId: member.id,
    groupId: member.groupId,
    amount: data.amount,
    monthlyAmount: data.paymentType === "mensualidad" ? data.amount : "0",
    cardAmount: data.paymentType === "reposicion_carne" ? data.amount : "0",
    paymentDate: today.toISOString().split("T")[0],
    paymentMethod: data.paymentMethod,
    periodStart: data.paymentType === "mensualidad" ? member.membershipEnd : null,
    periodEnd: data.paymentType === "mensualidad" ? newEndDate.toISOString().split("T")[0] : null,
    registeredBy: currentUser.id,
    notes: data.notes || (data.paymentType === "mensualidad" ? "Renovación de membresía" : "Reposición de carné"),
  });

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

  // Charge enrollment fee if member has been away >180 days (~6 months)
  const chargeEnrollment = daysOverdue > 180;

  return {
    membershipEnd: row.member.membershipEnd,
    nextMonthToPay,
    daysOverdue,
    chargeEnrollment,
    enrollmentFee: row.enrollmentFee,
    recentPayments,
  };
}
