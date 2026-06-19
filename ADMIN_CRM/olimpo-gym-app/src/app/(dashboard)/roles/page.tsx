import { db } from "@/db";
import { systemUsers, gyms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSystemUsers } from "@/actions/users";
import { UserTable } from "@/components/roles/UserTable";
import { UserClientPage } from "@/components/roles/UserClientPage";
import { ShieldAlert } from "lucide-react";

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  
  if (currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const allGyms = await db.select().from(gyms);
  const users = await getSystemUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-olimpo-gold flex items-center gap-2">
            <ShieldAlert className="w-8 h-8" />
            Roles y Accesos
          </h2>
          <p className="text-sm sm:text-base text-olimpo-text-muted mt-1">
            Administra qué usuarios de Google tienen acceso al panel de Aquarius Gym.
          </p>
        </div>
        
        {/* Render a client wrapper to handle the modal state */}
        <UserClientPage gyms={allGyms} />
      </div>

      <UserTable users={users} />
    </div>
  );
}
