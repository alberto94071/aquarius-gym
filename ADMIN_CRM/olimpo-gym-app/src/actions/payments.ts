"use server";

import { db } from "@/db";
import { members, payments, systemUsers, groups, gyms } from "@/db/schema";
import { eq, ilike, or, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { calculateMemberStatus, anniversaryDate } from "@/lib/utils";
import { syncMembersStatus } from "@/lib/sync";

/** Returns members in mora (for default payment list) */
export async function getMoraMembers(gymFilter?: string) {
  await syncMembersStatus();
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

  // Cada periodo cubre meses de aniversario y su clave es el mes donde INICIA:
  // un pago mensual iniciado el 14-jul cubre solo "jul"; uno trimestral
  // 14-jul→14-oct cubre jul, ago y sep. La cantidad de meses cubiertos es la
  // diferencia de meses calendario entre inicio y fin (mínimo 1).
  const paid: string[] = [];
  for (const p of paymentHistory) {
    if (!p.periodStart || !p.periodEnd) continue;
    const d1 = new Date(p.periodStart + "T12:00:00");
    const d2 = new Date(p.periodEnd + "T12:00:00");
    const monthsCovered = Math.max(
      1,
      (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
    );
    for (let i = 0; i < monthsCovered; i++) {
      const c = new Date(d1.getFullYear(), d1.getMonth() + i, 1);
      const k = `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}`;
      if (!paid.includes(k)) paid.push(k);
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
  let periodStartDate: Date | null = null;

  if (data.paymentType === "mensualidad" && data.paymentMonth) {
    const [yyyy, mm] = data.paymentMonth.split("-").map(Number);

    // Día de aniversario: el día del mes en que el miembro se inscribió.
    // El periodo pagado inicia ese día del mes seleccionado y vence el mismo
    // día del mes siguiente (ajustado en meses cortos).
    const anchorDay = new Date(member.membershipStart + "T12:00:00").getDate();
    periodStartDate = anniversaryDate(yyyy, mm - 1, anchorDay);
    newEndDate = anniversaryDate(yyyy, mm, anchorDay);

    // ── Guard: already paid check using actual payment history ──────────
    const paidMonths = await getMemberPaidMonths(data.memberId);
    const key = `${yyyy}-${String(mm).padStart(2, "0")}`;
    if (paidMonths.includes(key)) {
      const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      return {
        success: false,
        error: "ALREADY_PAID",
        message: `${MONTHS_ES[mm - 1]} ${yyyy} ya está pagado para este miembro. Selecciona otro mes.`
      };
    }

    // ── Validation: Check for skipped intermediate months & past months ─
    // El siguiente periodo a pagar inicia en la fecha de vencimiento actual,
    // así que el "mes a pagar" es el mes de membershipEnd.
    const currentEnd = new Date(member.membershipEnd + "T12:00:00");
    const nextPayDate = new Date(currentEnd.getFullYear(), currentEnd.getMonth(), 1);
    const selectedPayDate = new Date(yyyy, mm - 1, 1);

    const skippedMonths: string[] = [];
    const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

    let currentIter = new Date(nextPayDate.getFullYear(), nextPayDate.getMonth(), 1);
    while (currentIter < selectedPayDate) {
      const monthLabel = `${MONTHS_ES[currentIter.getMonth()]} ${currentIter.getFullYear()}`;
      skippedMonths.push(monthLabel);
      currentIter.setMonth(currentIter.getMonth() + 1);
    }

    const selectedMonthIsPast =
      yyyy < today.getFullYear() ||
      (yyyy === today.getFullYear() && mm < today.getMonth() + 1);

    // Combine warnings if not confirmed yet
    if (!data.forceConfirm) {
      const warnings: string[] = [];
      if (selectedMonthIsPast) {
        warnings.push(`${MONTHS_ES[mm - 1]} ${yyyy} es un mes pasado.`);
      }
      if (skippedMonths.length > 0) {
        warnings.push(`El usuario tiene meses pendientes sin pagar: ${skippedMonths.join(", ")}.`);
      }

      if (warnings.length > 0) {
        return {
          success: false,
          error: "CONFIRM_PAST_MONTH", // Re-use the existing frontend warning UI state
          message: `${warnings.join(" ")} ¿Confirmas que deseas registrar este pago?`
        };
      }
    }
    // ────────────────────────────────────────────────────────────────────

    // If the new end date is LATER than current membershipEnd, extend it
    const currentEndObj = new Date(member.membershipEnd + "T00:00:00");
    const finalEnd = newEndDate > currentEndObj ? newEndDate : currentEndObj;
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

    // El periodo pagado inicia en el día de aniversario del mes seleccionado
    const periodStart = periodStartDate!.toISOString().split("T")[0];

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

  // El siguiente periodo inicia en la fecha de vencimiento actual, así que
  // el próximo mes a cobrar es el mes de membershipEnd
  const next = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
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
