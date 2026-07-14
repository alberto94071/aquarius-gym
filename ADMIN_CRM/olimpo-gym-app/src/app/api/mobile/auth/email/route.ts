import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, gyms } from "@/db/schema";
import { eq, or, ilike } from "drizzle-orm";
import { signMobileJWT } from "@/lib/mobile-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Correo y contraseña requeridos" }, { status: 400 });
    }

    const identifier = email.trim().toLowerCase();

    // Máx. 10 intentos por IP y 10 por cuenta cada 15 minutos (anti fuerza bruta)
    const ipCheck = rateLimit(`auth-email:ip:${getClientIp(req)}`, 10, 15 * 60 * 1000);
    const idCheck = rateLimit(`auth-email:id:${identifier}`, 10, 15 * 60 * 1000);
    if (!ipCheck.ok || !idCheck.ok) {
      const retryAfter = Math.max(ipCheck.retryAfterSeconds, idCheck.retryAfterSeconds);
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } }
      );
    }

    // Allow login by email OR member code (case-insensitive)
    const [row] = await db
      .select({
        id: members.id,
        code: members.code,
        name: members.name,
        email: members.email,
        gymId: members.gymId,
        status: members.status,
        photoUrl: members.photoUrl,
        password: members.password,
        gymName: gyms.name,
      })
      .from(members)
      .leftJoin(gyms, eq(members.gymId, gyms.id))
      .where(or(
        eq(members.email, identifier),
        ilike(members.code, identifier)
      ))
      .limit(1);

    if (!row || !row.password) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, row.password);
    if (!valid) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
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
  } catch (error) {
    console.error("[mobile/auth/email]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
