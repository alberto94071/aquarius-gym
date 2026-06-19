import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bodyMeasurements } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";

// GET /api/mobile/measurements?limit=20
export async function GET(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const rows = await db
      .select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.memberId, auth.memberId))
      .orderBy(desc(bodyMeasurements.logDate))
      .limit(limit);

    return NextResponse.json({ measurements: rows });
  } catch (error) {
    console.error("[mobile/measurements GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/mobile/measurements
export async function POST(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { logDate, weightKg, waistCm, chestCm, hipsCm, armCm, notes } = body;

    if (!logDate) {
      return NextResponse.json({ error: "logDate requerido" }, { status: 400 });
    }

    const [inserted] = await db
      .insert(bodyMeasurements)
      .values({
        memberId: auth.memberId,
        logDate,
        weightKg: weightKg ? String(weightKg) : null,
        waistCm: waistCm ? String(waistCm) : null,
        chestCm: chestCm ? String(chestCm) : null,
        hipsCm: hipsCm ? String(hipsCm) : null,
        armCm: armCm ? String(armCm) : null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ measurement: inserted });
  } catch (error) {
    console.error("[mobile/measurements POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
