import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";

// GET /api/mobile/store — productos disponibles en la sede del miembro
export async function GET(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        category: products.category,
        salePrice: products.salePrice,
        stock: products.stock,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(and(eq(products.gymId, auth.gymId), eq(products.active, true), gt(products.stock, 0)))
      .orderBy(products.name);

    return NextResponse.json({ products: rows });
  } catch (error) {
    console.error("[mobile/store GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
