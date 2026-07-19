import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";

/**
 * API para el agente local del lector de huellas HID.
 * Headers: x-device-key: <ATTENDANCE_DEVICE_KEY>
 *
 * POST — guarda el template capturado al inscribir a un miembro
 *   Body: { code: string, template: string (base64) }
 *
 * GET — descarga todos los templates registrados de una sede para hacer el
 *   match localmente (el matching de huella ocurre en la PC de la sede).
 *   Query: ?gymId=... (opcional)
 */

function authorized(req: NextRequest): boolean {
  const key = req.headers.get("x-device-key");
  return !!process.env.ATTENDANCE_DEVICE_KEY && key === process.env.ATTENDANCE_DEVICE_KEY;
}

export async function POST(req: NextRequest) {
  try {
    if (!authorized(req)) return NextResponse.json({ error: "Dispositivo no autorizado" }, { status: 401 });

    const { code, template } = await req.json();
    if (!code || !template) {
      return NextResponse.json({ error: "code y template requeridos" }, { status: 400 });
    }

    const [member] = await db.select({ id: members.id }).from(members).where(eq(members.code, code));
    if (!member) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });

    await db.update(members).set({ fingerprintTemplate: template }).where(eq(members.id, member.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[attendance/fingerprint POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!authorized(req)) return NextResponse.json({ error: "Dispositivo no autorizado" }, { status: 401 });

    const gymId = new URL(req.url).searchParams.get("gymId");
    const conditions = [isNotNull(members.fingerprintTemplate)];
    if (gymId) conditions.push(eq(members.gymId, gymId));

    const rows = await db
      .select({ memberId: members.id, code: members.code, name: members.name, template: members.fingerprintTemplate })
      .from(members)
      .where(and(...conditions));

    return NextResponse.json({ templates: rows });
  } catch (error) {
    console.error("[attendance/fingerprint GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
