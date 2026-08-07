import { getExercises } from "@/actions/exercises";
import { NewRoutineClient } from "@/components/routines/NewRoutineClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { systemUsers, gyms } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function NewRoutinePage() {
  const session = await auth();
  const [currentUser] = await db
    .select({ role: systemUsers.role })
    .from(systemUsers)
    .where(eq(systemUsers.email, session!.user!.email!));
  const userRole = currentUser?.role ?? "coach";

  const [exercises, allGyms] = await Promise.all([
    getExercises(),
    userRole === "admin" ? db.select({ id: gyms.id, name: gyms.name }).from(gyms).orderBy(gyms.name) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/routines" className="inline-flex items-center gap-2 text-olimpo-text-muted hover:text-olimpo-gold transition-colors text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver a Rutinas
        </Link>
        <h1 className="text-2xl font-serif font-bold text-olimpo-gold">Nueva Rutina</h1>
      </div>
      <NewRoutineClient exercises={exercises} userRole={userRole} gyms={allGyms} />
    </div>
  );
}
