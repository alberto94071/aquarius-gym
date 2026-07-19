import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendances } from "@/db/schema";
import { eq, desc, gte, and, sql } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";

// GET /api/mobile/attendance — asistencias del miembro (para su app)
export async function GET(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const rows = await db
      .select({ id: attendances.id, checkinAt: attendances.checkinAt, source: attendances.source })
      .from(attendances)
      .where(eq(attendances.memberId, auth.memberId))
      .orderBy(desc(attendances.checkinAt))
      .limit(60);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [month] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(attendances)
      .where(and(eq(attendances.memberId, auth.memberId), gte(attendances.checkinAt, monthStart)));

    return NextResponse.json({ items: rows, thisMonth: month?.n ?? 0 });
  } catch (error) {
    console.error("[mobile/attendance]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
