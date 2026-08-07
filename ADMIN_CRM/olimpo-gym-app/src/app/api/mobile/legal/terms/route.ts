import { NextRequest, NextResponse } from "next/server";
import { getMobileAuth } from "@/lib/mobile-auth";
import { getCurrentTerms } from "@/lib/legal";

// GET /api/mobile/legal/terms — documento vigente de Términos de Uso
export async function GET(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const current = await getCurrentTerms();
    if (!current) {
      return NextResponse.json({ error: "Aún no hay términos publicados" }, { status: 404 });
    }

    return NextResponse.json(
      { version: current.version, title: current.title, contentHtml: current.contentHtml },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[mobile/legal/terms]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
