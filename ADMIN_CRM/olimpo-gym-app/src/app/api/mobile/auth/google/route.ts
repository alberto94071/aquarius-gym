import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, gyms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signMobileJWT } from "@/lib/mobile-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

async function getEmailFromIdToken(idToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const clientId = process.env.GOOGLE_CLIENT_ID_MOBILE || process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      // Sin client ID configurado no se puede validar a quién fue emitido el
      // token: rechazar en producción en lugar de aceptar cualquier token.
      if (process.env.NODE_ENV === "production") return null;
    } else if (data.aud !== clientId) {
      return null;
    }
    if (data.email_verified !== "true" && data.email_verified !== true) return null;
    return data.email || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`auth-google:ip:${getClientIp(req)}`, 20, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds), "Cache-Control": "no-store" } }
      );
    }

    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: "idToken requerido" }, { status: 400 });
    }

    const email = await getEmailFromIdToken(idToken);
    if (!email) {
      return NextResponse.json({ error: "Token de Google inválido" }, { status: 401 });
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
      .where(eq(members.email, email))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "No estás inscrito en Aquarius Gym" },
        { status: 404 }
      );
    }

    const token = await signMobileJWT({
      memberId: row.id,
      email: row.email,
      gymId: row.gymId,
    });

    return NextResponse.json(
      {
        token,
        member: {
          id: row.id,
          name: row.name,
          code: row.code,
          gym: { id: row.gymId, name: row.gymName },
          status: row.status,
          photoUrl: row.photoUrl,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    console.error("[mobile/auth/google]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
