"use server";

import { db } from "@/db";
import { members, payments, groups, gyms } from "@/db/schema";
import { eq, and, sql, gte, lt } from "drizzle-orm";

export async function getDashboardData(gymIdFilter?: string) {
  const today = new Date();
  
  const conditions = [];
  if (gymIdFilter) {
    conditions.push(eq(members.gymId, gymIdFilter));
  }

  // Use status column as source of truth (same as members list filter)
  const activeMembersQuery = db.select({ count: sql`count(*)` })
    .from(members)
    .where(and(...conditions, eq(members.status, "activo")));

  const moraMembersQuery = db.select({ count: sql`count(*)` })
    .from(members)
    .where(and(...conditions, eq(members.status, "mora")));

  const [activeRes] = await activeMembersQuery;
  const [moraRes] = await moraMembersQuery;
  
  const activeCount = Number(activeRes?.count || 0);
  const moraCount = Number(moraRes?.count || 0);

  // Income This Month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
  const paymentsConditions = [];
  if (gymIdFilter) {
    paymentsConditions.push(eq(payments.gymId, gymIdFilter));
  }
  paymentsConditions.push(gte(payments.paymentDate, startOfMonth.toISOString().split("T")[0]));
  paymentsConditions.push(lt(payments.paymentDate, startOfNextMonth.toISOString().split("T")[0]));

  const incomeQuery = db.select({ total: sql`sum(CAST(${payments.amount} AS NUMERIC))` })
    .from(payments)
    .where(and(...paymentsConditions));

  const [incomeRes] = await incomeQuery;
  const incomeTotal = Number(incomeRes?.total || 0);

  // Groups in Mora
  // A group is in mora if its representative is in mora
  const groupsInMoraQuery = db.select({
      member: members,
      gym: gyms,
      group: groups
    })
    .from(members)
    .innerJoin(gyms, eq(members.gymId, gyms.id))
    .innerJoin(groups, eq(members.groupId, groups.id))
    .where(and(
      ...conditions,
      eq(members.isRepresentative, true),
      eq(members.status, "mora")
    ));

  const groupsInMoraRaw = await groupsInMoraQuery;
  
  // We need to fetch how many members are in each group in mora
  // For a small app, we can just do a parallel query
  const groupsInMora = await Promise.all(groupsInMoraRaw.map(async (g) => {
    const [c] = await db.select({ count: sql`count(*)` }).from(members).where(eq(members.groupId, g.group.id));
    return {
      groupId: g.group.id,
      groupNumber: g.group.groupNumber,
      gymPrefix: g.gym.codePrefix,
      gymName: g.gym.name,
      repName: g.member.name,
      repPhone: g.member.phone,
      memberCount: Number(c?.count || 0)
    };
  }));

  // Birthdays This Month
  const currentMonth = today.getMonth() + 1; // 1-12
  const birthdaysQuery = db.select({
      id: members.id,
      name: members.name,
      birthDate: members.birthDate,
      gymName: gyms.name,
      phone: members.phone
    })
    .from(members)
    .innerJoin(gyms, eq(members.gymId, gyms.id))
    .where(and(
      ...conditions,
      sql`EXTRACT(MONTH FROM CAST(${members.birthDate} AS DATE)) = ${currentMonth}`
    ));

  const birthdaysRaw = await birthdaysQuery;
  const birthdays = birthdaysRaw.map(b => {
    const bDate = new Date(b.birthDate);
    const age = today.getFullYear() - bDate.getFullYear();
    const formattedDate = bDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    return {
      ...b,
      formattedDate,
      age
    };
  });

  return {
    activeCount,
    moraCount,
    incomeTotal,
    groupsInMora,
    birthdays
  };
}
