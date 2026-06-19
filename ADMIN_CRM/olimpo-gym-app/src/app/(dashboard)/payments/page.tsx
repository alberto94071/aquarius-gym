import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PaymentsDashboard } from "@/components/payments/PaymentsDashboard";
import { db } from "@/db";
import { systemUsers, gyms } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "Pagos y Renovaciones | Aquarius Gym",
};

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  const allGyms = await db.select().from(gyms);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-olimpo-gold">Caja y Pagos</h1>
        <p className="text-olimpo-text-muted mt-2">
          Busca un miembro para registrar su renovación mensual o cobrar reposición de carné.
        </p>
      </div>

      <PaymentsDashboard userRole={currentUser.role} gyms={allGyms} />
    </div>
  );
}
