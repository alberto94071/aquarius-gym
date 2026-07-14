import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

function getSecret(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MOBILE_JWT_SECRET no está configurado en producción");
    }
    return new TextEncoder().encode("fallback-dev-secret-change-in-prod");
  }
  return new TextEncoder().encode(secret);
}

const SECRET = getSecret();

export interface MobileJWTPayload {
  memberId: string;
  email: string;
  gymId: string;
}

export async function signMobileJWT(payload: MobileJWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyMobileJWT(token: string): Promise<MobileJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      memberId: payload.memberId as string,
      email: payload.email as string,
      gymId: payload.gymId as string,
    };
  } catch {
    return null;
  }
}

export async function getMobileAuth(req: NextRequest): Promise<MobileJWTPayload | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return verifyMobileJWT(token);
}
