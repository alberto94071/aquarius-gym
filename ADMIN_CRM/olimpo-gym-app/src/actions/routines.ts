"use server";

import { db } from "@/db";
import { routines, routineExercises, exercises, memberRoutines, members, systemUsers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Las rutinas se comparten entre las 3 sedes (igual que el banco de
// ejercicios) — cualquier usuario puede asignar cualquier rutina a
// cualquier miembro, sin importar en qué sede se haya creado.
export async function getRoutines() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  return db.select().from(routines).orderBy(desc(routines.createdAt));
}

export async function getRoutineById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [routine] = await db.select().from(routines).where(eq(routines.id, id));
  if (!routine) return null;

  const items = await db
    .select({
      re: routineExercises,
      exercise: exercises,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, id))
    .orderBy(routineExercises.sortOrder);

  return { ...routine, exercises: items };
}

export async function createRoutine(data: {
  gymId?: string;
  name: string;
  description?: string;
  dayLabel?: string;
  exerciseIds: { id: string; sets?: string; rest?: string; notes?: string }[];
}) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db
    .select()
    .from(systemUsers)
    .where(eq(systemUsers.email, session.user.email!));

  // gymId es solo informativo (de qué sede la creó) — la rutina queda
  // disponible para asignar en cualquier sede. Los admins no tienen sede
  // fija, así que queda null para ellos.
  const [routine] = await db
    .insert(routines)
    .values({
      gymId: currentUser.gymId ?? data.gymId ?? null,
      name: data.name,
      description: data.description || null,
      dayLabel: data.dayLabel || null,
      createdBy: currentUser.id,
    })
    .returning();

  for (let i = 0; i < data.exerciseIds.length; i++) {
    const ex = data.exerciseIds[i];
    await db.insert(routineExercises).values({
      routineId: routine.id,
      exerciseId: ex.id,
      sortOrder: i,
      sets: ex.sets || null,
      rest: ex.rest || null,
      notes: ex.notes || null,
    });
  }

  revalidatePath("/routines");
  return { success: true, id: routine.id };
}

export async function updateRoutine(
  id: string,
  data: {
    name?: string;
    description?: string;
    dayLabel?: string;
    exerciseIds?: { id: string; sets?: string; rest?: string; notes?: string }[];
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await db
    .update(routines)
    .set({
      name: data.name,
      description: data.description,
      dayLabel: data.dayLabel,
      updatedAt: new Date(),
    })
    .where(eq(routines.id, id));

  if (data.exerciseIds !== undefined) {
    await db.delete(routineExercises).where(eq(routineExercises.routineId, id));
    for (let i = 0; i < data.exerciseIds.length; i++) {
      const ex = data.exerciseIds[i];
      await db.insert(routineExercises).values({
        routineId: id,
        exerciseId: ex.id,
        sortOrder: i,
        sets: ex.sets || null,
        rest: ex.rest || null,
        notes: ex.notes || null,
      });
    }
  }

  revalidatePath("/routines");
  revalidatePath(`/routines/${id}`);
  return { success: true };
}

export async function deleteRoutine(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await db.delete(routines).where(eq(routines.id, id));
  revalidatePath("/routines");
  return { success: true };
}

export async function assignRoutineToMember(memberId: string, routineId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db
    .select()
    .from(systemUsers)
    .where(eq(systemUsers.email, session.user.email!));

  // Deactivate any existing active routine
  await db
    .update(memberRoutines)
    .set({ isActive: false })
    .where(and(eq(memberRoutines.memberId, memberId), eq(memberRoutines.isActive, true)));

  await db.insert(memberRoutines).values({
    memberId,
    routineId,
    assignedBy: currentUser.id,
    assignedAt: new Date().toISOString().split("T")[0],
    isActive: true,
  });

  revalidatePath(`/members/${memberId}`);
  return { success: true };
}

export async function getMemberActiveRoutine(memberId: string) {
  const [assignment] = await db
    .select({ routineId: memberRoutines.routineId })
    .from(memberRoutines)
    .where(and(eq(memberRoutines.memberId, memberId), eq(memberRoutines.isActive, true)))
    .limit(1);

  if (!assignment) return null;
  return getRoutineById(assignment.routineId);
}
