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
  Modal,
  Dimensions,
} from "react-native";
import Svg, { Path, Circle, Rect, Polyline, Line, Text as SvgText } from "react-native-svg";
import YoutubePlayer from "react-native-youtube-iframe";
import { Colors } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import type { Routine, WorkoutSession, SetLog } from "@/lib/types";

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

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

function TrendingIcon({ color = Colors.gold, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <Polyline points="17 6 23 6 23 12" />
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

// ─── Mini Line Chart (SVG) ────────────────────────────────────────────────────

interface ProgressSession {
  sessionDate: string;
  bestWeight: number;
  totalReps: number;
  sets: { setIndex: number; weight: string; reps: string }[];
}

function ProgressLineChart({ sessions }: { sessions: ProgressSession[] }) {
  const SCREEN_W = Dimensions.get("window").width - 80;
  const W = SCREEN_W;
  const H = 90;
  const PAD = 10;

  if (sessions.length < 2) return null;

  const weights = sessions.map((s) => s.bestWeight);
  const min = Math.min(...weights);
  const max = Math.max(...weights, min + 1);
  const n = sessions.length;

  const pts = sessions.map((s, i) => ({
    x: PAD + (i / (n - 1)) * (W - PAD * 2),
    y: PAD + ((max - s.bestWeight) / (max - min)) * (H - PAD * 2),
    weight: s.bestWeight,
    date: s.sessionDate,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={{ marginVertical: 8 }}>
      <Svg width={W} height={H}>
        {/* Grid line at max */}
        <Line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} stroke={Colors.border} strokeWidth={0.5} strokeDasharray="4,4" />
        <Line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={Colors.border} strokeWidth={0.5} strokeDasharray="4,4" />
        {/* Line */}
        <Polyline
          points={polyline}
          fill="none"
          stroke={Colors.gold}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={Colors.gold} />
        ))}
        {/* Labels max/min */}
        <SvgText x={2} y={PAD + 4} fontSize={8} fill={Colors.dim}>{max}kg</SvgText>
        <SvgText x={2} y={H - PAD + 4} fontSize={8} fill={Colors.dim}>{min}kg</SvgText>
      </Svg>
    </View>
  );
}

// ─── Progress History Modal ────────────────────────────────────────────────────

function ProgressModal({
  visible,
  exerciseName,
  exerciseId,
  onClose,
}: {
  visible: boolean;
  exerciseName: string;
  exerciseId: string | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ProgressSession[]>([]);

  useEffect(() => {
    if (!visible || !exerciseId) return;
    setLoading(true);
    setSessions([]);
    apiFetch<{ sessions: ProgressSession[] }>(`/api/mobile/progress?exerciseId=${exerciseId}&limit=10`)
      .then((r) => setSessions(r.sessions ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [visible, exerciseId]);

  const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  function fmtDate(iso: string) {
    const d = new Date(iso);
    return `${d.getDate()} ${monthNames[d.getMonth()]}`;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modalStyles.container}>
        {/* Header */}
        <View style={modalStyles.header}>
          <View>
            <Text style={modalStyles.headerLabel}>HISTORIAL DE PROGRESO</Text>
            <Text style={modalStyles.headerTitle}>{exerciseName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Text style={modalStyles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modalStyles.content}>
          {loading && (
            <ActivityIndicator color={Colors.gold} style={{ marginTop: 40 }} />
          )}

          {!loading && sessions.length === 0 && (
            <View style={modalStyles.empty}>
              <TrendingIcon size={40} color={Colors.dim} />
              <Text style={modalStyles.emptyTitle}>Sin historial aún</Text>
              <Text style={modalStyles.emptyText}>
                Completa tu primer entrenamiento con este ejercicio y aquí verás tu progreso.
              </Text>
            </View>
          )}

          {!loading && sessions.length > 0 && (
            <>
              {/* Chart */}
              <View style={modalStyles.chartSection}>
                <Text style={modalStyles.sectionLabel}>PROGRESIÓN DE PESO</Text>
                <ProgressLineChart sessions={[...sessions].reverse()} />
                <View style={modalStyles.statRow}>
                  <View style={modalStyles.stat}>
                    <Text style={modalStyles.statValue}>
                      {Math.max(...sessions.map((s) => s.bestWeight))} kg
                    </Text>
                    <Text style={modalStyles.statLabel}>Máximo alcanzado</Text>
                  </View>
                  <View style={modalStyles.stat}>
                    <Text style={modalStyles.statValue}>{sessions.length}</Text>
                    <Text style={modalStyles.statLabel}>Sesiones registradas</Text>
                  </View>
                  <View style={modalStyles.stat}>
                    <Text style={[modalStyles.statValue,
                      sessions[0].bestWeight > sessions[sessions.length - 1].bestWeight
                        ? { color: Colors.green }
                        : { color: Colors.dim }
                    ]}>
                      {sessions[0].bestWeight > sessions[sessions.length - 1].bestWeight
                        ? `+${(sessions[0].bestWeight - sessions[sessions.length - 1].bestWeight).toFixed(1)}`
                        : `${(sessions[0].bestWeight - sessions[sessions.length - 1].bestWeight).toFixed(1)}`
                      } kg
                    </Text>
                    <Text style={modalStyles.statLabel}>Desde inicio</Text>
                  </View>
                </View>
              </View>

              {/* Session list */}
              <Text style={[modalStyles.sectionLabel, { marginTop: 20, paddingHorizontal: 20 }]}>
                ÚLTIMAS SESIONES
              </Text>
              {sessions.map((s, idx) => (
                <View key={s.sessionDate + idx} style={modalStyles.sessionCard}>
                  <View style={modalStyles.sessionHeader}>
                    <Text style={modalStyles.sessionDate}>{fmtDate(s.sessionDate)}</Text>
                    <View style={modalStyles.sessionBadge}>
                      <Text style={modalStyles.sessionBadgeText}>{s.bestWeight} kg</Text>
                    </View>
                  </View>
                  <View style={modalStyles.sessionSets}>
                    {s.sets.map((st) => (
                      <View key={st.setIndex} style={modalStyles.setChip}>
                        <Text style={modalStyles.setChipText}>
                          S{st.setIndex + 1}: {st.weight}kg × {st.reps}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
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
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [historyExercise, setHistoryExercise] = useState<{ id: string; name: string } | null>(null);

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
    <>
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
              const ytId = ex.videoUrl ? getYouTubeId(ex.videoUrl) : null;
              const isPlaying = playingVideo === ex.exerciseId;

              return (
                <View key={ex.routineExerciseId} style={[styles.exerciseCard, allDone && styles.exerciseCardDone]}>
                  {/* YouTube player or image */}
                  {ytId ? (
                    <View style={styles.videoContainer}>
                      {isPlaying ? (
                        <YoutubePlayer
                          height={200}
                          play={true}
                          videoId={ytId}
                          onChangeState={(state) => {
                            if (state === "ended") setPlayingVideo(null);
                          }}
                        />
                      ) : (
                        <TouchableOpacity
                          onPress={() => setPlayingVideo(ex.exerciseId)}
                          style={styles.videoThumb}
                          activeOpacity={0.85}
                        >
                          <Image
                            source={{ uri: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` }}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode="cover"
                          />
                          <View style={styles.playOverlay}>
                            <View style={styles.playButton}>
                              <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
                                <Path d="M8 5v14l11-7z" />
                              </Svg>
                            </View>
                            <Text style={styles.videoLabel}>Ver técnica del instructor</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : ex.imageUrl ? (
                    <Image source={{ uri: ex.imageUrl }} style={styles.exerciseImage} resizeMode="cover" />
                  ) : null}

                  {/* Header */}
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseHeaderLeft}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <Text style={styles.exerciseMuscle}>{ex.muscleGroup}</Text>
                    </View>
                    <View style={styles.exerciseHeaderRight}>
                      {allDone && (
                        <View style={styles.doneBadge}>
                          <CheckIcon size={12} color={Colors.green} />
                          <Text style={styles.doneBadgeText}>Listo</Text>
                        </View>
                      )}
                      {/* Historial button */}
                      <TouchableOpacity
                        onPress={() => setHistoryExercise({ id: ex.exerciseId, name: ex.name })}
                        style={styles.historyBtn}
                      >
                        <TrendingIcon size={13} color={Colors.gold} />
                        <Text style={styles.historyBtnText}>Historial</Text>
                      </TouchableOpacity>
                    </View>
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

      {/* ─── Progress History Modal ─── */}
      <ProgressModal
        visible={historyExercise !== null}
        exerciseName={historyExercise?.name ?? ""}
        exerciseId={historyExercise?.id ?? null}
        onClose={() => setHistoryExercise(null)}
      />
    </>
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

  progressSection: { paddingHorizontal: 24, marginBottom: 20 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { color: Colors.dim, fontSize: 12 },
  progressPct: { color: Colors.gold, fontSize: 12, fontWeight: "700" },
  progressBg: { height: 6, backgroundColor: Colors.card2, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Colors.gold, borderRadius: 3 },
  savingText: { color: Colors.dim, fontSize: 10, marginTop: 4 },

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

  phaseContent: { paddingHorizontal: 24, gap: 16 },
  phaseTitle: { color: Colors.text, fontSize: 17, fontWeight: "700" },
  phaseSubtitle: { color: Colors.dim, fontSize: 13, lineHeight: 20, marginTop: -8 },

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
  exerciseHeaderRight: { alignItems: "flex-end", gap: 6 },
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
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.gold + "15",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  historyBtnText: { color: Colors.gold, fontSize: 11, fontWeight: "600" },
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

  videoContainer: { width: "100%", backgroundColor: "#000" },
  videoThumb: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF0000",
    alignItems: "center",
    justifyContent: "center",
  },
  videoLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLabel: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "Cinzel_700Bold",
    marginBottom: 4,
  },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: "800" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card2,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: Colors.dim, fontSize: 14, fontWeight: "700" },
  content: { paddingBottom: 40 },

  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyText: { color: Colors.dim, fontSize: 13, textAlign: "center", lineHeight: 20 },

  chartSection: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "Cinzel_700Bold",
    marginBottom: 12,
  },

  statRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { color: Colors.gold, fontSize: 18, fontWeight: "800" },
  statLabel: { color: Colors.dim, fontSize: 10, textAlign: "center" },

  sessionCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sessionDate: { color: Colors.text, fontSize: 14, fontWeight: "600" },
  sessionBadge: {
    backgroundColor: Colors.gold + "20",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sessionBadgeText: { color: Colors.gold, fontSize: 13, fontWeight: "700" },
  sessionSets: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  setChip: {
    backgroundColor: Colors.card2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  setChipText: { color: Colors.dim, fontSize: 11, fontWeight: "500" },
});
