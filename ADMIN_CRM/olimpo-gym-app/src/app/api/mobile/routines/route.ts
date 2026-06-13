import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memberRoutines, routines, routineExercises, exercises } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Get active routine assignment
    const [assignment] = await db
      .select({ routineId: memberRoutines.routineId })
      .from(memberRoutines)
      .where(and(eq(memberRoutines.memberId, auth.memberId), eq(memberRoutines.isActive, true)))
      .limit(1);

    if (!assignment) return NextResponse.json({ routine: null });

    const [routine] = await db
      .select()
      .from(routines)
      .where(eq(routines.id, assignment.routineId))
      .limit(1);

    if (!routine) return NextResponse.json({ routine: null });

    const items = await db
      .select({
        id: routineExercises.id,
        sortOrder: routineExercises.sortOrder,
        sets: routineExercises.sets,
        rest: routineExercises.rest,
        notes: routineExercises.notes,
        exerciseId: exercises.id,
        exerciseName: exercises.name,
        muscleGroup: exercises.muscleGroup,
        defaultSets: exercises.defaultSets,
        defaultRest: exercises.defaultRest,
        exerciseNotes: exercises.notes,
        imageUrl: exercises.imageUrl,
      })
      .from(routineExercises)
      .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
      .where(eq(routineExercises.routineId, routine.id))
      .orderBy(routineExercises.sortOrder);

    return NextResponse.json({
      routine: {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        dayLabel: routine.dayLabel,
        exercises: items.map((i) => ({
          routineExerciseId: i.id,
          exerciseId: i.exerciseId,
          name: i.exerciseName,
          muscleGroup: i.muscleGroup,
          sets: i.sets || i.defaultSets || "3 x 10-12",
          rest: i.rest || i.defaultRest || "2 min",
          notes: i.notes || i.exerciseNotes || "",
          imageUrl: i.imageUrl,
          sortOrder: i.sortOrder,
        })),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
