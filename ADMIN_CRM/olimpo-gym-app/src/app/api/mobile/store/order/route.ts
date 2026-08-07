import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, sales } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";

// POST /api/mobile/store/order — apartar un producto desde la app
// El miembro se compromete: si no lo paga, el saldo se suma a su siguiente mensualidad.
export async function POST(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { productId, quantity, paymentIntent, intendedAmount } = await req.json();
    const qty = Math.max(1, Math.min(10, Number(quantity) || 1));
    if (!productId) return NextResponse.json({ error: "productId requerido" }, { status: 400 });

    const intent: "luego" | "abono" | "mensualidad" =
      ["luego", "abono", "mensualidad"].includes(paymentIntent) ? paymentIntent : "luego";

    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.gymId, auth.gymId), eq(products.active, true)));

    if (!product) return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
    if (product.stock < qty) {
      return NextResponse.json({ error: `Solo quedan ${product.stock} disponibles` }, { status: 400 });
    }

    const total = (Number(product.salePrice) * qty).toFixed(2);

    // Monto que el miembro DECLARA que abonará al recogerlo (no es un cobro
    // real — la app no procesa pagos; el staff lo cobra y lo registra en persona).
    let declaredAmount: string | null = null;
    if (intent === "abono") {
      const amt = Number(intendedAmount);
      if (Number.isFinite(amt) && amt > 0 && amt < Number(total)) {
        declaredAmount = amt.toFixed(2);
      }
    }

    const intentNote: Record<typeof intent, string> = {
      luego: "Pagará completo en la sede al recogerlo.",
      abono: declaredAmount
        ? `Dará un abono de Q${declaredAmount} al recogerlo y pagará el resto después.`
        : "Dará un abono al recogerlo.",
      mensualidad: "Prefiere que se sume a su próxima mensualidad.",
    };

    const sale = await db.transaction(async (tx) => {
      const [s] = await tx.insert(sales).values({
        gymId: product.gymId,
        productId: product.id,
        memberId: auth.memberId,
        quantity: qty,
        unitPrice: product.salePrice,
        total,
        amountPaid: "0",
        status: "apartado",
        soldBy: null, // pedido desde la app
        notes: `Apartado desde la app móvil. ${intentNote[intent]}`,
        paymentIntent: intent,
        intendedAmount: declaredAmount,
      }).returning();

      await tx.update(products)
        .set({ stock: product.stock - qty, updatedAt: new Date() })
        .where(eq(products.id, product.id));

      return s;
    });

    const MESSAGES: Record<typeof intent, string> = {
      luego: "Apartado registrado. Pasa a tu sede a pagarlo — el saldo se sumará a tu siguiente mensualidad si no lo pagas antes.",
      abono: "Apartado registrado. Cuando lo recojas, entrega el abono que indicaste y el resto se sumará a tu siguiente mensualidad.",
      mensualidad: "Apartado registrado. El costo se sumará a tu siguiente mensualidad.",
    };

    return NextResponse.json({
      success: true,
      sale: { id: sale.id, total, productName: product.name, quantity: qty },
      message: MESSAGES[intent],
    });
  } catch (error) {
    console.error("[mobile/store/order POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
