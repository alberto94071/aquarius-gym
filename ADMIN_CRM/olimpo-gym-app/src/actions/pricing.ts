"use server";

import { db } from "@/db";
import { gyms, systemUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateGymPricing(gymId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  if (currentUser.role !== "admin") throw new Error("No tienes permisos para realizar esta acción");

  const pricingMonthly = formData.get("pricingMonthly") as string;
  const pricingGroupDefault = formData.get("pricingGroupDefault") as string;
  const enrollmentFee = formData.get("enrollmentFee") as string;
  const cardFee = formData.get("cardFee") as string;
  const pricingDayPass = formData.get("pricingDayPass") as string;

  // Horarios de turnos de la sede (hora 0-23)
  const hour = (name: string, fallback: number) => {
    const v = parseInt(formData.get(name) as string);
    return Number.isFinite(v) && v >= 0 && v <= 23 ? v : fallback;
  };
  const shiftAmStart = hour("shiftAmStart", 6);
  const shiftAmEnd = hour("shiftAmEnd", 13);
  const shiftPmStart = hour("shiftPmStart", 13);
  const shiftPmEnd = hour("shiftPmEnd", 21);
  if (shiftAmStart >= shiftAmEnd || shiftPmStart >= shiftPmEnd) {
    throw new Error("El horario de cada turno debe iniciar antes de terminar");
  }

  await db.update(gyms)
    .set({
      pricingMonthly,
      pricingGroupDefault,
      enrollmentFee,
      cardFee,
      ...(pricingDayPass ? { pricingDayPass } : {}),
      shiftAmStart,
      shiftAmEnd,
      shiftPmStart,
      shiftPmEnd,
    })
    .where(eq(gyms.id, gymId));

  revalidatePath("/pricing");
  revalidatePath("/members/new");
  revalidatePath("/groups/new");
  return { success: true };
}
