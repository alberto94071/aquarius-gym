import { auth } from "@/auth";
import { db } from "@/db";
import { systemUsers, gyms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { listProducts, listSales, getSalesSummary, getMyShiftStatus, listShiftClosures } from "@/actions/ventas";
import { VentasClient } from "@/components/ventas/VentasClient";

export default async function VentasPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const [currentUser] = await db
    .select({ id: systemUsers.id, role: systemUsers.role, gymId: systemUsers.gymId, shift: systemUsers.shift })
    .from(systemUsers)
    .where(eq(systemUsers.email, session.user.email));
  if (!currentUser) redirect("/login");

  const isAdmin = currentUser.role === "admin";
  const allGyms = isAdmin ? await db.select({ id: gyms.id, name: gyms.name }).from(gyms).orderBy(gyms.name) : [];

  const [productsList, salesList, summary, shiftStatus, closures] = await Promise.all([
    listProducts(),
    listSales(),
    isAdmin ? getSalesSummary() : Promise.resolve(null),
    getMyShiftStatus(),
    listShiftClosures(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-olimpo-gold flex items-center gap-3">
          <ShoppingCart className="w-6 h-6" /> Ventas
        </h1>
        <p className="text-olimpo-text-muted text-sm mt-1">
          {isAdmin
            ? "Inventario, ventas, abonos y ganancias de todas las sedes."
            : "Registra ventas y abonos de tu turno, y envía tu cuadre antes del cierre."}
        </p>
      </div>
      <VentasClient
        isAdmin={isAdmin}
        gyms={allGyms}
        products={productsList}
        sales={salesList}
        summary={summary}
        shiftStatus={shiftStatus ? {
          status: shiftStatus.closure.status,
          openingConfirmed: !!shiftStatus.closure.openingConfirmedAt,
          minutesLeft: shiftStatus.minutesLeft,
          shouldWarn: shiftStatus.shouldWarn,
          shiftEnd: shiftStatus.shiftEnd,
          shift: shiftStatus.shift,
          inventory: shiftStatus.inventory,
        } : null}
        closures={closures}
      />
    </div>
  );
}
