import { NextRequest } from "next/server";

/**
 * Rate limiter en memoria (ventana deslizante).
 *
 * Nota: en serverless (Vercel) el contador vive por instancia, así que es una
 * protección "best effort" contra fuerza bruta. Para un límite global exacto
 * se necesitaría un store compartido (p. ej. Upstash Redis), pero para el
 * volumen de esta app esto frena los ataques prácticos sin dependencias extra.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Evitar crecimiento sin límite de memoria
  if (buckets.size > MAX_BUCKETS) buckets.clear();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  bucket.timestamps.push(now);
  return {
    ok: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
