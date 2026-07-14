import { db } from "@/db";
import { members, groups } from "@/db/schema";
import { and, eq, sql, inArray } from "drizzle-orm";

export async function syncMembersStatus() {
  const today = new Date().toISOString().split("T")[0];

  // 1. Marcar como "mora" a quienes superaron el plazo de gracia (7 días tras el vencimiento)
  await db.update(members)
    .set({ status: "mora", paid: false })
    .where(and(
      sql`(${members.membershipEnd}::date + '7 days'::interval)::date < ${today}::date`,
      eq(members.status, "activo")
    ));

  // 2. Reactivar a quienes aún están dentro del plazo
  await db.update(members)
    .set({ status: "activo", paid: true })
    .where(and(
      sql`(${members.membershipEnd}::date + '7 days'::interval)::date >= ${today}::date`,
      eq(members.status, "mora")
    ));

  // 3. Sincronizar el estado del grupo si el representante está en mora o activo
  const reps = await db.select({ groupId: members.groupId, status: members.status })
    .from(members)
    .where(and(
      eq(members.isRepresentative, true),
      sql`${members.groupId} IS NOT NULL`
    ));

  const moraGroupIds = reps.filter(r => r.status === "mora").map(r => r.groupId) as string[];
  const activoGroupIds = reps.filter(r => r.status === "activo").map(r => r.groupId) as string[];

  if (moraGroupIds.length > 0) {
    await db.update(groups)
      .set({ paidFull: false })
      .where(inArray(groups.id, moraGroupIds));
  }

  if (activoGroupIds.length > 0) {
    await db.update(groups)
      .set({ paidFull: true })
      .where(inArray(groups.id, activoGroupIds));
  }
}
