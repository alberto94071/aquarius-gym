import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workoutSessions, workoutSetLogs, exercises } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";

// GET /api/mobile/progress?exerciseId=xxx&limit=10
export async function GET(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const exerciseId = searchParams.get("exerciseId");
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10")));

    if (!exerciseId) {
      return NextResponse.json({ error: "exerciseId requerido" }, { status: 400 });
    }

    // Get completed sessions where this exercise was logged
    const setLogsWithSessions = await db
      .select({
        sessionId: workoutSetLogs.sessionId,
        setIndex: workoutSetLogs.setIndex,
        weight: workoutSetLogs.weight,
        reps: workoutSetLogs.reps,
        completed: workoutSetLogs.completed,
        sessionDate: workoutSessions.sessionDate,
        completedAt: workoutSessions.completedAt,
      })
      .from(workoutSetLogs)
      .innerJoin(workoutSessions, eq(workoutSetLogs.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSetLogs.exerciseId, exerciseId),
          eq(workoutSessions.memberId, auth.memberId),
          eq(workoutSetLogs.completed, true)
        )
      )
      .orderBy(desc(workoutSessions.sessionDate))
      .limit(limit * 5); // fetch more to group by session

    // Group by session
    const sessionsMap = new Map<
      string,
      {
        sessionId: string;
        sessionDate: string;
        sets: { setIndex: number; weight: string; reps: string }[];
      }
    >();

    for (const row of setLogsWithSessions) {
      if (!sessionsMap.has(row.sessionId)) {
        sessionsMap.set(row.sessionId, {
          sessionId: row.sessionId,
          sessionDate: row.sessionDate,
          sets: [],
        });
      }
      sessionsMap.get(row.sessionId)!.sets.push({
        setIndex: row.setIndex,
        weight: row.weight ?? "0",
        reps: row.reps ?? "0",
      });
    }

    // Sort sessions by date desc and take limit
    const sessions = Array.from(sessionsMap.values())
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
      .slice(0, limit)
      .map((s) => ({
        ...s,
        sets: s.sets.sort((a, b) => a.setIndex - b.setIndex),
        // Best set = max weight with most reps
        bestWeight: Math.max(
          ...s.sets.map((st) => parseFloat(st.weight) || 0)
        ),
        totalReps: s.sets.reduce(
          (acc, st) => acc + (parseInt(st.reps) || 0),
          0
        ),
      }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[mobile/progress]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
