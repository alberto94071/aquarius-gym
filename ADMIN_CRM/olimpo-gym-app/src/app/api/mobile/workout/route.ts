import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workoutSessions, workoutSetLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";

// GET /api/mobile/workout — get today's session (or null)
export async function GET(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const today = new Date().toISOString().split("T")[0];

    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.memberId, auth.memberId), eq(workoutSessions.sessionDate, today)))
      .limit(1);

    if (!session) return NextResponse.json({ session: null });

    const setLogs = await db
      .select()
      .from(workoutSetLogs)
      .where(eq(workoutSetLogs.sessionId, session.id));

    return NextResponse.json({ session: { ...session, setLogs } });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/mobile/workout — create or update today's session
export async function POST(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { routineId, currentPhase, setLogs, completedAt } = body;

    const today = new Date().toISOString().split("T")[0];

    // Upsert session
    const existing = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.memberId, auth.memberId), eq(workoutSessions.sessionDate, today)))
      .limit(1);

    let sessionId: string;

    if (existing.length > 0) {
      sessionId = existing[0].id;
      await db
        .update(workoutSessions)
        .set({
          currentPhase: currentPhase || existing[0].currentPhase,
          completedAt: completedAt ? new Date(completedAt) : existing[0].completedAt,
        })
        .where(eq(workoutSessions.id, sessionId));
    } else {
      const [newSession] = await db
        .insert(workoutSessions)
        .values({
          memberId: auth.memberId,
          routineId,
          sessionDate: today,
          currentPhase: currentPhase || "warmup",
          completedAt: completedAt ? new Date(completedAt) : null,
        })
        .returning();
      sessionId = newSession.id;
    }

    // Update set logs if provided
    if (setLogs && Array.isArray(setLogs)) {
      for (const log of setLogs) {
        const existingLog = await db
          .select()
          .from(workoutSetLogs)
          .where(
            and(
              eq(workoutSetLogs.sessionId, sessionId),
              eq(workoutSetLogs.exerciseId, log.exerciseId),
              eq(workoutSetLogs.setIndex, log.setIndex)
            )
          )
          .limit(1);

        if (existingLog.length > 0) {
          await db
            .update(workoutSetLogs)
            .set({ weight: log.weight, reps: log.reps, completed: log.completed })
            .where(eq(workoutSetLogs.id, existingLog[0].id));
        } else {
          await db.insert(workoutSetLogs).values({
            sessionId,
            exerciseId: log.exerciseId,
            setIndex: log.setIndex,
            weight: log.weight || null,
            reps: log.reps || null,
            completed: log.completed || false,
          });
        }
      }
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
