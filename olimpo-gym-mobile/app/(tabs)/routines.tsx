import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
} from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { Colors } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import type { Routine, WorkoutSession, SetLog } from "@/lib/types";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function DumbbellIcon({ color = Colors.gold, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 5v14M18 5v14M6 8h12M6 16h12" />
      <Rect x="2" y="6" width="4" height="12" rx="2" />
      <Rect x="18" y="6" width="4" height="12" rx="2" />
    </Svg>
  );
}

function CheckIcon({ color = Colors.green, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

function ClockIcon({ color = Colors.dim, size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
}

// ─── Rest Timer ───────────────────────────────────────────────────────────────

function RestTimer({ rest }: { rest: string }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function reset() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setSeconds(0);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const running = intervalRef.current !== null;

  return (
    <TouchableOpacity
      onPress={running ? reset : start}
      style={[styles.restTimer, running && styles.restTimerActive]}
    >
      <ClockIcon color={running ? Colors.gold : Colors.dim} size={12} />
      <Text style={[styles.restTimerText, running && styles.restTimerTextActive]}>
        {running ? `${mins}:${String(secs).padStart(2, "0")}` : rest}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${Math.min(100, pct)}%` as `${number}%` }]} />
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseSetCount(sets: string): number {
  const m = sets.match(/^(\d+)/);
  return m ? parseInt(m[1]) : 3;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RoutinesScreen() {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [phase, setPhase] = useState<"warmup" | "exercise" | "stretch">("warmup");
  const [setLogs, setSetLogs] = useState<Record<string, SetLog[]>>({});
  const [warmupChecks, setWarmupChecks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [routineData, sessionData] = await Promise.all([
        apiFetch<{ routine: Routine | null }>("/api/mobile/routines"),
        apiFetch<{ session: WorkoutSession | null }>("/api/mobile/workout"),
      ]);

      setRoutine(routineData.routine);

      if (sessionData.session) {
        const s = sessionData.session;
        setSession(s);
        setPhase(s.currentPhase);
        // Restore set logs
        const logsMap: Record<string, SetLog[]> = {};
        for (const log of s.setLogs) {
          if (!logsMap[log.exerciseId]) logsMap[log.exerciseId] = [];
          logsMap[log.exerciseId][log.setIndex] = log;
        }
        setSetLogs(logsMap);
      }
    } catch (err) {
      console.error("Routines load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  async function saveProgress(newPhase?: "warmup" | "exercise" | "stretch", newLogs?: SetLog[]) {
    if (!routine) return;
    setSaving(true);
    try {
      const allLogs: SetLog[] = newLogs ?? Object.values(setLogs).flat();
      await apiFetch("/api/mobile/workout", {
        method: "POST",
        body: JSON.stringify({
          routineId: routine.id,
          currentPhase: newPhase ?? phase,
          setLogs: allLogs,
        }),
      });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  function changePhase(p: "warmup" | "exercise" | "stretch") {
    setPhase(p);
    saveProgress(p);
  }

  function toggleSetCompleted(exerciseId: string, setIndex: number) {
    setSetLogs((prev) => {
      const sets = [...(prev[exerciseId] ?? [])];
      const existing = sets[setIndex] ?? { exerciseId, setIndex, weight: "", reps: "", completed: false };
      sets[setIndex] = { ...existing, completed: !existing.completed };
      const updated = { ...prev, [exerciseId]: sets };
      const allLogs: SetLog[] = Object.values(updated).flat().filter(Boolean);
      saveProgress(undefined, allLogs);
      return updated;
    });
  }

  function updateSetField(exerciseId: string, setIndex: number, field: "weight" | "reps", value: string) {
    setSetLogs((prev) => {
      const sets = [...(prev[exerciseId] ?? [])];
      const existing = sets[setIndex] ?? { exerciseId, setIndex, weight: "", reps: "", completed: false };
      sets[setIndex] = { ...existing, [field]: value };
      return { ...prev, [exerciseId]: sets };
    });
  }

  function toggleWarmup(key: string) {
    setWarmupChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function getProgress(): number {
    if (!routine) return 0;
    const totalSets = routine.exercises.reduce((acc, ex) => acc + parseSetCount(ex.sets), 0);
    const completed = Object.values(setLogs).flat().filter((s) => s?.completed).length;
    return totalSets === 0 ? 0 : Math.round((completed / totalSets) * 100);
  }

  async function finishWorkout() {
    Alert.alert("Sesión completada", "¡Excelente trabajo! La sesión ha sido guardada.", [{ text: "OK" }]);
    await apiFetch("/api/mobile/workout", {
      method: "POST",
      body: JSON.stringify({
        routineId: routine?.id,
        currentPhase: "stretch",
        completedAt: new Date().toISOString(),
        setLogs: Object.values(setLogs).flat().filter(Boolean),
      }),
    });
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  // ─── No routine assigned ───────────────────────────────────────────────────
  if (!routine) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rutinas</Text>
          <Text style={styles.headerSede}>TU ENTRENAMIENTO</Text>
        </View>
        <View style={styles.emptyState}>
          <DumbbellIcon size={48} color={Colors.dim} />
          <Text style={styles.emptyTitle}>Sin rutina asignada</Text>
          <Text style={styles.emptyText}>
            Habla con tu coach o administrador para que te asignen una rutina personalizada.
          </Text>
        </View>
      </View>
    );
  }

  const progress = getProgress();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.headerSede}>TU ENTRENAMIENTO</Text>
        <Text style={styles.headerTitle}>{routine.name}</Text>
        {routine.dayLabel && <Text style={styles.headerDayLabel}>{routine.dayLabel}</Text>}
      </View>

      {/* ─── Progress ─── */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Progreso de la sesión</Text>
          <Text style={styles.progressPct}>{progress}%</Text>
        </View>
        <ProgressBar pct={progress} />
        {saving && <Text style={styles.savingText}>Guardando...</Text>}
      </View>

      {/* ─── Phase Tabs ─── */}
      <View style={styles.phaseTabs}>
        {(["warmup", "exercise", "stretch"] as const).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => changePhase(p)}
            style={[styles.phaseTab, phase === p && styles.phaseTabActive]}
          >
            <Text style={[styles.phaseTabText, phase === p && styles.phaseTabTextActive]}>
              {p === "warmup" ? "Calentamiento" : p === "exercise" ? "Ejercicios" : "Estiramientos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Warmup Phase ─── */}
      {phase === "warmup" && (
        <View style={styles.phaseContent}>
          <Text style={styles.phaseTitle}>Calentamiento general (~5 min)</Text>
          <Text style={styles.phaseSubtitle}>
            Mueve el cuerpo, activa las articulaciones y prepárate para el entrenamiento.
          </Text>

          {/* Warmup checklist */}
          {[
            "Saltar la cuerda o caminar rápido 3 min",
            "Círculos de brazos (15 hacia adelante, 15 hacia atrás)",
            "Sentadillas sin peso x 15 reps",
            "Rotaciones de cadera x 10 cada lado",
            "Estocadas sin peso x 10 pasos",
          ].map((item, i) => {
            const key = `w${i}`;
            return (
              <TouchableOpacity key={key} onPress={() => toggleWarmup(key)} style={styles.checkItem}>
                <View style={[styles.checkBox, warmupChecks[key] && styles.checkBoxDone]}>
                  {warmupChecks[key] && <CheckIcon size={14} color="#000" />}
                </View>
                <Text style={[styles.checkText, warmupChecks[key] && styles.checkTextDone]}>{item}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={() => changePhase("exercise")} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>Ir a Ejercicios →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Exercise Phase ─── */}
      {phase === "exercise" && (
        <View style={styles.phaseContent}>
          {routine.exercises.map((ex) => {
            const setCount = parseSetCount(ex.sets);
            const logs = setLogs[ex.exerciseId] ?? [];
            const allDone = Array.from({ length: setCount }, (_, i) => i).every((i) => logs[i]?.completed);

            return (
              <View key={ex.routineExerciseId} style={[styles.exerciseCard, allDone && styles.exerciseCardDone]}>
                {/* Exercise image */}
                {ex.imageUrl && (
                  <Image source={{ uri: ex.imageUrl }} style={styles.exerciseImage} resizeMode="cover" />
                )}

                {/* Header */}
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseHeaderLeft}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseMuscle}>{ex.muscleGroup}</Text>
                  </View>
                  {allDone && (
                    <View style={styles.doneBadge}>
                      <CheckIcon size={12} color={Colors.green} />
                      <Text style={styles.doneBadgeText}>Listo</Text>
                    </View>
                  )}
                </View>

                {/* Badges */}
                <View style={styles.exerciseBadges}>
                  <View style={styles.badge}><Text style={styles.badgeText}>{ex.sets}</Text></View>
                  <View style={styles.badge}>
                    <ClockIcon size={10} color={Colors.gold} />
                    <Text style={styles.badgeText}>{ex.rest}</Text>
                  </View>
                </View>

                {ex.notes ? <Text style={styles.exerciseNotes}>{ex.notes}</Text> : null}

                {/* Set rows */}
                <View style={styles.setsList}>
                  {Array.from({ length: setCount }, (_, i) => {
                    const log = logs[i] ?? { exerciseId: ex.exerciseId, setIndex: i, weight: "", reps: "", completed: false };
                    return (
                      <View key={i} style={styles.setRow}>
                        <TouchableOpacity
                          onPress={() => toggleSetCompleted(ex.exerciseId, i)}
                          style={[styles.setCheckbox, log.completed && styles.setCheckboxDone]}
                        >
                          {log.completed && <CheckIcon size={12} color="#000" />}
                        </TouchableOpacity>
                        <Text style={styles.setLabel}>S{i + 1}</Text>
                        <TextInput
                          style={styles.setInput}
                          placeholder="kg"
                          placeholderTextColor={Colors.dim}
                          value={log.weight}
                          onChangeText={(v) => updateSetField(ex.exerciseId, i, "weight", v)}
                          keyboardType="decimal-pad"
                        />
                        <TextInput
                          style={styles.setInput}
                          placeholder="reps"
                          placeholderTextColor={Colors.dim}
                          value={log.reps}
                          onChangeText={(v) => updateSetField(ex.exerciseId, i, "reps", v)}
                          keyboardType="number-pad"
                          onEndEditing={() => saveProgress()}
                        />
                        <RestTimer rest={ex.rest} />
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          <View style={styles.phaseNavRow}>
            <TouchableOpacity onPress={() => changePhase("warmup")} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Calentamiento</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changePhase("stretch")} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>Estiramientos →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── Stretch Phase ─── */}
      {phase === "stretch" && (
        <View style={styles.phaseContent}>
          <Text style={styles.phaseTitle}>Estiramientos finales (~7 min)</Text>
          <Text style={styles.phaseSubtitle}>Tómate el tiempo necesario. Los estiramientos reducen lesiones y mejoran la recuperación.</Text>

          {[
            { name: "Pectoral en puerta", duration: "30 seg/lado", how: "Antebrazo en el marco, girar el cuerpo al lado contrario" },
            { name: "Isquiotibiales", duration: "30 seg/lado", how: "Pierna extendida, inclinar desde la cadera" },
            { name: "Flexor de cadera", duration: "30 seg/lado", how: "Posición de estocada, rodilla trasera en el piso" },
            { name: "Cuádriceps de pie", duration: "30 seg/lado", how: "Agarrar tobillo por detrás, talón al glúteo" },
            { name: "Hombro cruzado", duration: "30 seg/lado", how: "Brazo extendido al lado contrario, presionar con la otra mano" },
          ].map((s, i) => {
            const key = `s${i}`;
            return (
              <TouchableOpacity key={key} onPress={() => toggleWarmup(key)} style={styles.stretchItem}>
                <View style={[styles.checkBox, warmupChecks[key] && styles.checkBoxDone]}>
                  {warmupChecks[key] && <CheckIcon size={14} color="#000" />}
                </View>
                <View style={styles.stretchBody}>
                  <View style={styles.stretchHeader}>
                    <Text style={[styles.checkText, warmupChecks[key] && styles.checkTextDone]}>{s.name}</Text>
                    <View style={styles.badge}><Text style={styles.badgeText}>{s.duration}</Text></View>
                  </View>
                  <Text style={styles.stretchHow}>{s.how}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.phaseNavRow}>
            <TouchableOpacity onPress={() => changePhase("exercise")} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Ejercicios</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={finishWorkout} style={styles.finishBtn}>
              <Text style={styles.finishBtnText}>Finalizar sesión ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  loader: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },

  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  headerSede: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    fontFamily: "Cinzel_700Bold",
    marginBottom: 6,
  },
  headerTitle: { color: Colors.text, fontSize: 26, fontWeight: "800" },
  headerDayLabel: { color: Colors.gold, fontSize: 13, marginTop: 4, fontWeight: "600" },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
    paddingTop: 80,
  },
  emptyTitle: { color: Colors.text, fontSize: 20, fontWeight: "800", textAlign: "center" },
  emptyText: { color: Colors.dim, fontSize: 14, textAlign: "center", lineHeight: 22 },

  // Progress
  progressSection: { paddingHorizontal: 24, marginBottom: 20 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { color: Colors.dim, fontSize: 12 },
  progressPct: { color: Colors.gold, fontSize: 12, fontWeight: "700" },
  progressBg: { height: 6, backgroundColor: Colors.card2, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Colors.gold, borderRadius: 3 },
  savingText: { color: Colors.dim, fontSize: 10, marginTop: 4 },

  // Phase tabs
  phaseTabs: {
    flexDirection: "row",
    marginHorizontal: 24,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 2,
  },
  phaseTab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  phaseTabActive: { backgroundColor: Colors.gold },
  phaseTabText: { color: Colors.dim, fontSize: 11, fontWeight: "600" },
  phaseTabTextActive: { color: "#000", fontSize: 11, fontWeight: "700" },

  // Phase content
  phaseContent: { paddingHorizontal: 24, gap: 16 },
  phaseTitle: { color: Colors.text, fontSize: 17, fontWeight: "700" },
  phaseSubtitle: { color: Colors.dim, fontSize: 13, lineHeight: 20, marginTop: -8 },

  // Warmup / stretch checklist
  checkItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkBoxDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkText: { color: Colors.text, fontSize: 14, flex: 1, lineHeight: 20 },
  checkTextDone: { color: Colors.dim, textDecorationLine: "line-through" },

  stretchItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stretchBody: { flex: 1 },
  stretchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  stretchHow: { color: Colors.dim, fontSize: 12, marginTop: 4, lineHeight: 18 },

  // Exercise cards
  exerciseCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  exerciseCardDone: { borderColor: Colors.green + "50" },
  exerciseImage: { width: "100%", height: 160 },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 14,
    paddingBottom: 6,
  },
  exerciseHeaderLeft: { flex: 1 },
  exerciseName: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  exerciseMuscle: { color: Colors.dim, fontSize: 11, marginTop: 2, textTransform: "capitalize" },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.green + "20",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneBadgeText: { color: Colors.green, fontSize: 11, fontWeight: "700" },
  exerciseBadges: { flexDirection: "row", gap: 8, paddingHorizontal: 14, marginBottom: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.card2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: Colors.gold, fontSize: 11, fontWeight: "600" },
  exerciseNotes: { color: Colors.dim, fontSize: 12, paddingHorizontal: 14, marginBottom: 8, fontStyle: "italic" },

  // Set rows
  setsList: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  setRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  setCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  setCheckboxDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  setLabel: { color: Colors.dim, fontSize: 12, width: 20, textAlign: "center" },
  setInput: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: Colors.text,
    fontSize: 13,
    textAlign: "center",
  },

  // Rest timer
  restTimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.card2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minWidth: 60,
    justifyContent: "center",
  },
  restTimerActive: { backgroundColor: Colors.gold + "20", borderWidth: 1, borderColor: Colors.gold + "50" },
  restTimerText: { color: Colors.dim, fontSize: 11, fontWeight: "600" },
  restTimerTextActive: { color: Colors.gold },

  // Navigation buttons
  phaseNavRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  nextBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  nextBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },
  backBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: { color: Colors.text, fontWeight: "600", fontSize: 14 },
  finishBtn: {
    flex: 1,
    backgroundColor: Colors.green,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  finishBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },
});
