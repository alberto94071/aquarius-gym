import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";
import { getCurrentTerms } from "@/lib/legal";

// POST /api/mobile/legal/accept — registra la aceptación de la versión vigente
export async function POST(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const current = await getCurrentTerms();
    if (!current) {
      return NextResponse.json({ error: "Aún no hay términos publicados" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    // El cliente debe confirmar la versión que leyó: si el admin publicó una
    // versión más nueva justo en ese momento, se rechaza para forzar releer.
    if (body.version !== current.version) {
      return NextResponse.json(
        { error: "Hay una versión más reciente de los términos. Vuelve a cargarlos.", currentVersion: current.version },
        { status: 409 }
      );
    }

    await db
      .update(members)
      .set({ termsAcceptedVersion: current.version, termsAcceptedAt: new Date() })
      .where(eq(members.id, auth.memberId));

    return NextResponse.json({ success: true, version: current.version });
  } catch (error) {
    console.error("[mobile/legal/accept]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
