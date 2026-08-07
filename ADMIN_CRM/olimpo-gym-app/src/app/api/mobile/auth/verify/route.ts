import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, gyms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";
import { needsTermsAcceptance } from "@/lib/legal";

export async function POST(req: NextRequest) {
  try {
    const payload = await getMobileAuth(req);

    if (!payload) {
      return NextResponse.json({ valid: false, error: "Token inválido o expirado" });
    }

    const [row] = await db
      .select({
        id: members.id,
        code: members.code,
        name: members.name,
        email: members.email,
        gymId: members.gymId,
        status: members.status,
        photoUrl: members.photoUrl,
        gymName: gyms.name,
      })
      .from(members)
      .leftJoin(gyms, eq(members.gymId, gyms.id))
      .where(eq(members.id, payload.memberId))
      .limit(1);

    if (!row) {
      return NextResponse.json({ valid: false, error: "Miembro no encontrado" });
    }

    const terms = await needsTermsAcceptance(row.id);

    return NextResponse.json({
      valid: true,
      member: {
        id: row.id,
        name: row.name,
        code: row.code,
        gym: { id: row.gymId, name: row.gymName },
        status: row.status,
        photoUrl: row.photoUrl,
      },
      termsAcceptanceRequired: terms.needsAcceptance,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno";
    console.error("[mobile/auth/verify]", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
