"use server";

import { db } from "@/db";
import { exercises, systemUsers } from "@/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getExercises(gymId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db
    .select()
    .from(systemUsers)
    .where(eq(systemUsers.email, session.user.email!));

  const effectiveGymId = currentUser.role === "admin" ? gymId : currentUser.gymId ?? undefined;

  if (effectiveGymId) {
    return db
      .select()
      .from(exercises)
      .where(or(eq(exercises.gymId, effectiveGymId), eq(exercises.gymId, null as unknown as string)))
      .orderBy(exercises.muscleGroup, exercises.name);
  }

  return db.select().from(exercises).orderBy(exercises.muscleGroup, exercises.name);
}

export async function createExercise(data: {
  name: string;
  muscleGroup: "pecho" | "espalda" | "hombros" | "biceps" | "triceps" | "piernas" | "gluteos" | "core" | "cardio" | "full_body";
  defaultSets?: string;
  defaultRest?: string;
  notes?: string;
  imageUrl?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db
    .select()
    .from(systemUsers)
    .where(eq(systemUsers.email, session.user.email!));

  await db.insert(exercises).values({
    gymId: currentUser.gymId ?? null,
    name: data.name,
    muscleGroup: data.muscleGroup,
    defaultSets: data.defaultSets || "3 x 10-12",
    defaultRest: data.defaultRest || "2 min",
    notes: data.notes || null,
    imageUrl: data.imageUrl || null,
    createdBy: currentUser.id,
  });

  revalidatePath("/exercises");
  return { success: true };
}

export async function updateExercise(
  id: string,
  data: {
    name?: string;
    muscleGroup?: "pecho" | "espalda" | "hombros" | "biceps" | "triceps" | "piernas" | "gluteos" | "core" | "cardio" | "full_body";
    defaultSets?: string;
    defaultRest?: string;
    notes?: string;
    imageUrl?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await db.update(exercises).set(data).where(eq(exercises.id, id));
  revalidatePath("/exercises");
  return { success: true };
}

export async function deleteExercise(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await db.delete(exercises).where(eq(exercises.id, id));
  revalidatePath("/exercises");
  return { success: true };
}
