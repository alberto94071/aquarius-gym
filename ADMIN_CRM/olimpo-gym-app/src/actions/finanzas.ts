"use server";

import { db } from "@/db";
import { payments, members, gyms } from "@/db/schema";
import { eq, and, sql, gte, lt, inArray } from "drizzle-orm";

export interface MonthRevenue {
  month: string;   // "Ene", "Feb", etc.
  year: number;
  total: number;
  enrollment: number;
  monthly: number;
}

export interface GymSummary {
  gymId: string;
  gymName: string;
  active: number;
  mora: number;
  revenue: number;
}

export async function getFinancialData(gymIdFilter?: string) {
  const today = new Date();

  // ── 6 meses de ingresos ──────────────────────────────────────────────────
  const months: MonthRevenue[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const start = d.toISOString().split("T")[0];
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      .toISOString()
      .split("T")[0];

    // Group by covered month (periodStart) when available, else by paymentDate
    const conditions = [
      sql`COALESCE(${payments.periodStart}, ${payments.paymentDate}) >= ${start}`,
      sql`COALESCE(${payments.periodStart}, ${payments.paymentDate}) < ${end}`,
    ];
    if (gymIdFilter) conditions.push(eq(payments.gymId, gymIdFilter));

    const [res] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
        enrollment: sql<number>`COALESCE(SUM(CAST(${payments.enrollmentAmount} AS NUMERIC)), 0)`,
        monthly: sql<number>`COALESCE(SUM(CAST(${payments.monthlyAmount} AS NUMERIC)), 0)`,
      })
      .from(payments)
      .where(and(...conditions));

    const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    months.push({
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      total: Number(res.total),
      enrollment: Number(res.enrollment),
      monthly: Number(res.monthly),
    });
  }

  // ── Estado de membresías (usa columna status como fuente de verdad) ─────
  const todayStr = today.toISOString().split("T")[0];

  const memberConditions: ReturnType<typeof eq>[] = [];
  if (gymIdFilter) memberConditions.push(eq(members.gymId, gymIdFilter));

  const [statusRes] = await db
    .select({
      active: sql<number>`COUNT(*) FILTER (WHERE ${members.status} = 'activo')`,
      atRisk: sql<number>`COUNT(*) FILTER (WHERE ${members.status} = 'activo' AND ${members.membershipEnd}::date < (CURRENT_DATE + '8 days'::interval)::date)`,
      mora: sql<number>`COUNT(*) FILTER (WHERE ${members.status} = 'mora')`,
    })
    .from(members)
    .where(memberConditions.length ? and(...memberConditions) : undefined);

  // ── Ingresos del mes actual ──────────────────────────────────────────────
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    .toISOString()
    .split("T")[0];

  const monthConditions = [
    gte(payments.paymentDate, startOfMonth),
    lt(payments.paymentDate, startOfNextMonth),
  ];
  if (gymIdFilter) monthConditions.push(eq(payments.gymId, gymIdFilter));

  const [currentMonthRes] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
      txCount: sql<number>`COUNT(*)`,
    })
    .from(payments)
    .where(and(...monthConditions));

  // ── Por sede (solo admin sin filtro) ────────────────────────────────────
  let bySede: GymSummary[] = [];
  if (!gymIdFilter) {
    const allGyms = await db.select({ id: gyms.id, name: gyms.name }).from(gyms);

    bySede = await Promise.all(
      allGyms.map(async (g) => {
        const [rev] = await db
          .select({
            total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.gymId, g.id),
              gte(payments.paymentDate, startOfMonth),
              lt(payments.paymentDate, startOfNextMonth)
            )
          );

        const [counts] = await db
          .select({
            active: sql<number>`COUNT(*) FILTER (WHERE ${members.status} = 'activo')`,
            mora: sql<number>`COUNT(*) FILTER (WHERE ${members.status} = 'mora')`,
          })
          .from(members)
          .where(eq(members.gymId, g.id));

        return {
          gymId: g.id,
          gymName: g.name,
          active: Number(counts.active),
          mora: Number(counts.mora),
          revenue: Number(rev.total),
        };
      })
    );
  }

  return {
    months,
    status: {
      active: Number(statusRes.active),
      atRisk: Number(statusRes.atRisk),
      mora: Number(statusRes.mora),
    },
    currentMonth: {
      total: Number(currentMonthRes.total),
      txCount: Number(currentMonthRes.txCount),
    },
    bySede,
  };
}
