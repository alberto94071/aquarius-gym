import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, gyms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signMobileJWT } from "@/lib/mobile-auth";

const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

async function getEmailFromIdToken(idToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${idToken}`);
    if (!res.ok) return null;
    const data = await res.json();
    const clientId = process.env.GOOGLE_CLIENT_ID_MOBILE || process.env.GOOGLE_CLIENT_ID;
    if (clientId && data.aud !== clientId) return null;
    return data.email || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json({
      token,
      member: {
        id: row.id,
        name: row.name,
        code: row.code,
        gym: { id: row.gymId, name: row.gymName },
        status: row.status,
        photoUrl: row.photoUrl,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno";
    console.error("[mobile/auth/google]", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
