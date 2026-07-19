import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, attendances, gyms } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { calculateMemberStatus } from "@/lib/utils";

/**
 * POST /api/attendance/checkin — registra la asistencia de un miembro.
 * Lo llama el AGENTE LOCAL del lector de huellas HID (o un check-in manual).
 *
 * Headers: x-device-key: <ATTENDANCE_DEVICE_KEY>
 * Body: { memberId?: string, code?: string, source?: "huella" | "manual" }
 *
 * Devuelve nombre y estado del miembro para mostrarlo en la pantalla de la sede.
 */
export async function POST(req: NextRequest) {
  try {
    const deviceKey = req.headers.get("x-device-key");
    if (!process.env.ATTENDANCE_DEVICE_KEY || deviceKey !== process.env.ATTENDANCE_DEVICE_KEY) {
      return NextResponse.json({ error: "Dispositivo no autorizado" }, { status: 401 });
    }

    const { memberId, code, source } = await req.json();
    if (!memberId && !code) {
      return NextResponse.json({ error: "memberId o code requerido" }, { status: 400 });
    }

    const [member] = await db
      .select({
        id: members.id, name: members.name, code: members.code,
        gymId: members.gymId, status: members.status, membershipEnd: members.membershipEnd,
        gymName: gyms.name,
      })
      .from(members)
      .leftJoin(gyms, eq(members.gymId, gyms.id))
      .where(memberId ? eq(members.id, memberId) : eq(members.code, code))
      .limit(1);

    if (!member) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });

    // Evitar doble check-in en menos de 2 horas
    const twoHoursAgo = new Date(Date.now() - 2 * 3600_000);
    const [recent] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(attendances)
      .where(and(eq(attendances.memberId, member.id), gte(attendances.checkinAt, twoHoursAgo)));

    if (!recent || recent.n === 0) {
      await db.insert(attendances).values({
        memberId: member.id,
        gymId: member.gymId,
        source: source === "manual" ? "manual" : "huella",
      });
    }

    const liveStatus = member.status === "activo" || member.status === "mora"
      ? calculateMemberStatus(member.membershipEnd)
      : member.status;

    return NextResponse.json({
      success: true,
      duplicate: !!recent && recent.n > 0,
      member: { name: member.name, code: member.code, gym: member.gymName, status: liveStatus },
    });
  } catch (error) {
    console.error("[attendance/checkin]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
