import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, gyms } from "@/db/schema";
import { eq, or, ilike } from "drizzle-orm";
import { signMobileJWT } from "@/lib/mobile-auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Correo y contraseña requeridos" }, { status: 400 });
    }

    const identifier = email.trim().toLowerCase();

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
  } catch (error) {
    console.error("[mobile/auth/email]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
