import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";
import { auth } from "@/auth";

/** One-time endpoint to sync member statuses based on membershipEnd date.
 *  Only accessible to logged-in admin sessions.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  // mora si superó los 7 días de gracia tras el vencimiento
  const toMora = await db.update(members)
    .set({ status: "mora", paid: false })
    .where(and(
      sql`(${members.membershipEnd}::date + '7 days'::interval)::date < ${today}::date`,
      eq(members.status, "activo")
    ))
    .returning({ id: members.id });

  // reactivar si aún está dentro del plazo de gracia
  const toActivo = await db.update(members)
    .set({ status: "activo", paid: true })
    .where(and(
      sql`(${members.membershipEnd}::date + '7 days'::interval)::date >= ${today}::date`,
      eq(members.status, "mora")
    ))
    .returning({ id: members.id });

  return NextResponse.json({
    updated: { toMora: toMora.length, toActivo: toActivo.length },
  });
}
