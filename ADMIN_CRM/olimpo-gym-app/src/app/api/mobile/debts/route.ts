import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, products, salePayments } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";

// GET /api/mobile/debts — cuentas pendientes del miembro (crédito/apartado)
export async function GET(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const rows = await db
      .select({
        id: sales.id,
        quantity: sales.quantity,
        total: sales.total,
        amountPaid: sales.amountPaid,
        status: sales.status,
        saleDate: sales.saleDate,
        productName: products.name,
      })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .where(and(eq(sales.memberId, auth.memberId), inArray(sales.status, ["credito", "apartado"])))
      .orderBy(desc(sales.saleDate));

    // Abonos de cada venta pendiente
    const saleIds = rows.map((r) => r.id);
    const abonos = saleIds.length
      ? await db
          .select({ saleId: salePayments.saleId, amount: salePayments.amount, paymentDate: salePayments.paymentDate })
          .from(salePayments)
          .where(inArray(salePayments.saleId, saleIds))
          .orderBy(desc(salePayments.paymentDate))
      : [];

    const items = rows.map((r) => ({
      ...r,
      saldo: (Number(r.total) - Number(r.amountPaid)).toFixed(2),
      abonos: abonos.filter((a) => a.saleId === r.id),
    }));

    const totalDebt = rows.reduce((s, r) => s + (Number(r.total) - Number(r.amountPaid)), 0);

    return NextResponse.json({ items, totalDebt: totalDebt.toFixed(2) });
  } catch (error) {
    console.error("[mobile/debts GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
