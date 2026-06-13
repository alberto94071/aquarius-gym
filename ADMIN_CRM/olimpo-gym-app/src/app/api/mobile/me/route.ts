import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, gyms, groups, payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Fetch member + gym
    const [row] = await db
      .select({
        // Member fields
        id: members.id,
        code: members.code,
        name: members.name,
        phone: members.phone,
        email: members.email,
        birthDate: members.birthDate,
        sex: members.sex,
        photoUrl: members.photoUrl,
        plan: members.plan,
        price: members.price,
        membershipStart: members.membershipStart,
        membershipEnd: members.membershipEnd,
        status: members.status,
        paid: members.paid,
        groupId: members.groupId,
        // Gym fields
        gymId: gyms.id,
        gymName: gyms.name,
        gymAddress: gyms.address,
        gymPhone: gyms.phone,
        gymSchedule: gyms.schedule,
      })
      .from(members)
      .leftJoin(gyms, eq(members.gymId, gyms.id))
      .where(eq(members.id, auth.memberId))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    // Calculate daysRemaining
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(row.membershipEnd);
    const diffMs = end.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Fetch group info if member belongs to one
    let groupInfo = null;
    if (row.groupId) {
      const [grp] = await db
        .select({
          id: groups.id,
          groupNumber: groups.groupNumber,
          pricePerPerson: groups.pricePerPerson,
          paidFull: groups.paidFull,
          representativeId: groups.representativeId,
        })
        .from(groups)
        .where(eq(groups.id, row.groupId))
        .limit(1);

      if (grp) {
        // Fetch representative name/phone
        let repName: string | null = null;
        let repPhone: string | null = null;
        let memberCount = 0;

        if (grp.representativeId) {
          const [rep] = await db
            .select({ name: members.name, phone: members.phone })
            .from(members)
            .where(eq(members.id, grp.representativeId))
            .limit(1);
          repName = rep?.name ?? null;
          repPhone = rep?.phone ?? null;
        }

        // Count members in group
        const allGroupMembers = await db
          .select({ id: members.id })
          .from(members)
          .where(eq(members.groupId, row.groupId));
        memberCount = allGroupMembers.length;

        groupInfo = {
          id: grp.id,
          groupNumber: grp.groupNumber,
          repName,
          repPhone,
          paidFull: grp.paidFull,
          memberCount,
        };
      }
    }

    // Effective status: if in a group with paidFull=false → bloqueado
    let effectiveStatus = row.status;
    if (groupInfo && !groupInfo.paidFull) {
      effectiveStatus = "bloqueado";
    }

    // Payment history
    const paymentHistory = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        date: payments.paymentDate,
        method: payments.paymentMethod,
        notes: payments.notes,
        periodStart: payments.periodStart,
        periodEnd: payments.periodEnd,
      })
      .from(payments)
      .where(eq(payments.memberId, auth.memberId))
      .orderBy(desc(payments.paymentDate));

    return NextResponse.json({
      id: row.id,
      code: row.code,
      name: row.name,
      phone: row.phone,
      email: row.email,
      birthDate: row.birthDate,
      sex: row.sex,
      photoUrl: row.photoUrl,
      gym: {
        id: row.gymId,
        name: row.gymName,
        address: row.gymAddress,
        phone: row.gymPhone,
        schedule: row.gymSchedule,
      },
      plan: row.plan,
      price: row.price,
      membershipStart: row.membershipStart,
      membershipEnd: row.membershipEnd,
      daysRemaining,
      status: effectiveStatus,
      paid: row.paid,
      group: groupInfo,
      paymentHistory,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno";
    console.error("[mobile/me]", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
