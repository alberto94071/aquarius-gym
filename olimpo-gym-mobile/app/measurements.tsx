import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Dimensions,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Polyline, Circle, Line, Text as SvgText } from "react-native-svg";
import { Colors } from "@/constants/colors";
import { apiFetch } from "@/lib/api";

interface Measurement {
  id: string;
  logDate: string;
  weightKg: string | null;
  waistCm: string | null;
  chestCm: string | null;
  hipsCm: string | null;
  armCm: string | null;
  notes: string | null;
}

// ─── Mini Line Chart ──────────────────────────────────────────────────────────

function MiniChart({
  values,
  label,
  color = Colors.gold,
}: {
  values: number[];
  label: string;
  color?: string;
}) {
  const W = (Dimensions.get("window").width - 80) / 2;
  const H = 60;
  const PAD = 8;

  if (values.length < 2) {
    return (
      <View style={[chartStyles.wrap, { width: W }]}>
        <Text style={chartStyles.label}>{label}</Text>
        <View style={[chartStyles.chartArea, { width: W, height: H }]}>
          <Text style={chartStyles.noData}>Sin datos aún</Text>
        </View>
      </View>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values, min + 1);
  const n = values.length;
  const pts = values.map((v, i) => ({
    x: PAD + (i / (n - 1)) * (W - PAD * 2),
    y: PAD + ((max - v) / (max - min)) * (H - PAD * 2),
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const last = pts[pts.length - 1];

  return (
    <View style={[chartStyles.wrap, { width: W }]}>
      <Text style={chartStyles.label}>{label}</Text>
      <Svg width={W} height={H}>
        <Polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={last.x} cy={last.y} r={3} fill={color} />
        <SvgText x={last.x - 2} y={last.y - 6} fontSize={8} fill={color} textAnchor="middle">
          {values[values.length - 1]}
        </SvgText>
      </Svg>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrap: { alignItems: "flex-start" },
  label: { color: Colors.dim, fontSize: 10, fontWeight: "600", letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" },
  chartArea: { alignItems: "center", justifyContent: "center" },
  noData: { color: Colors.dim, fontSize: 10 },
});

// ─── Log Form Modal ───────────────────────────────────────────────────────────

function LogFormModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    logDate: today,
    weightKg: "",
    waistCm: "",
    chestCm: "",
    hipsCm: "",
    armCm: "",
    notes: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.weightKg && !form.waistCm && !form.chestCm && !form.hipsCm && !form.armCm) {
      Alert.alert("Ingresa al menos una medida");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/mobile/measurements", {
        method: "POST",
        body: JSON.stringify({
          logDate: form.logDate,
          weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
          waistCm: form.waistCm ? parseFloat(form.waistCm) : null,
          chestCm: form.chestCm ? parseFloat(form.chestCm) : null,
          hipsCm: form.hipsCm ? parseFloat(form.hipsCm) : null,
          armCm: form.armCm ? parseFloat(form.armCm) : null,
          notes: form.notes || null,
        }),
      });
      setForm({ logDate: today, weightKg: "", waistCm: "", chestCm: "", hipsCm: "", armCm: "", notes: "" });
      onSaved();
      onClose();
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={formStyles.container}>
        <View style={formStyles.header}>
          <Text style={formStyles.headerTitle}>Registrar medidas</Text>
          <TouchableOpacity onPress={onClose} style={formStyles.closeBtn}>
            <Text style={formStyles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={formStyles.content}>
          <Text style={formStyles.hint}>Completa solo los campos disponibles. Todos son opcionales excepto la fecha.</Text>

          <View style={formStyles.grid}>
            <View style={formStyles.field}>
              <Text style={formStyles.fieldLabel}>Peso (kg)</Text>
              <TextInput
                style={formStyles.input}
                value={form.weightKg}
                onChangeText={(v) => set("weightKg", v)}
                placeholder="ej. 72.5"
                placeholderTextColor={Colors.dim}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={formStyles.field}>
              <Text style={formStyles.fieldLabel}>Cintura (cm)</Text>
              <TextInput
                style={formStyles.input}
                value={form.waistCm}
                onChangeText={(v) => set("waistCm", v)}
                placeholder="ej. 82"
                placeholderTextColor={Colors.dim}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={formStyles.field}>
              <Text style={formStyles.fieldLabel}>Pecho (cm)</Text>
              <TextInput
                style={formStyles.input}
                value={form.chestCm}
                onChangeText={(v) => set("chestCm", v)}
                placeholder="ej. 96"
                placeholderTextColor={Colors.dim}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={formStyles.field}>
              <Text style={formStyles.fieldLabel}>Cadera (cm)</Text>
              <TextInput
                style={formStyles.input}
                value={form.hipsCm}
                onChangeText={(v) => set("hipsCm", v)}
                placeholder="ej. 90"
                placeholderTextColor={Colors.dim}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={formStyles.field}>
              <Text style={formStyles.fieldLabel}>Brazo (cm)</Text>
              <TextInput
                style={formStyles.input}
                value={form.armCm}
                onChangeText={(v) => set("armCm", v)}
                placeholder="ej. 36"
                placeholderTextColor={Colors.dim}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={formStyles.field}>
              <Text style={formStyles.fieldLabel}>Fecha</Text>
              <TextInput
                style={formStyles.input}
                value={form.logDate}
                onChangeText={(v) => set("logDate", v)}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={Colors.dim}
              />
            </View>
          </View>

          <View style={formStyles.fieldFull}>
            <Text style={formStyles.fieldLabel}>Notas (opcional)</Text>
            <TextInput
              style={[formStyles.input, formStyles.inputMulti]}
              value={form.notes}
              onChangeText={(v) => set("notes", v)}
              placeholder="Cómo te sentiste, contexto..."
              placeholderTextColor={Colors.dim}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[formStyles.saveBtn, saving && formStyles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#000" />
              : <Text style={formStyles.saveBtnText}>Guardar medidas</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const formStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: "800" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.card2, alignItems: "center", justifyContent: "center",
  },
  closeBtnText: { color: Colors.dim, fontSize: 14, fontWeight: "700" },
  content: { padding: 20, gap: 16 },
  hint: { color: Colors.dim, fontSize: 13, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  field: { width: "47%" },
  fieldFull: {},
  fieldLabel: { color: Colors.dim, fontSize: 11, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
  },
  inputMulti: { height: 80, textAlignVertical: "top" },
  saveBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

export default function MeasurementsScreen() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ measurements: Measurement[] }>("/api/mobile/measurements");
      setMeasurements(res.measurements ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Extract number arrays for charts (reversed = oldest first)
  const reversed = [...measurements].reverse();
  const weights = reversed.map((m) => parseFloat(m.weightKg ?? "0")).filter((v) => v > 0);
  const waists = reversed.map((m) => parseFloat(m.waistCm ?? "0")).filter((v) => v > 0);
  const chests = reversed.map((m) => parseFloat(m.chestCm ?? "0")).filter((v) => v > 0);
  const hips = reversed.map((m) => parseFloat(m.hipsCm ?? "0")).filter((v) => v > 0);
  const arms = reversed.map((m) => parseFloat(m.armCm ?? "0")).filter((v) => v > 0);

  const latest = measurements[0];
  const prev = measurements[1];

  function delta(cur: string | null, old: string | null) {
    const c = parseFloat(cur ?? "0");
    const o = parseFloat(old ?? "0");
    if (!c || !o) return null;
    const d = c - o;
    return d;
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Perfil</Text>
          </TouchableOpacity>
          <Text style={styles.headerSede}>SEGUIMIENTO CORPORAL</Text>
          <Text style={styles.headerTitle}>Mis Medidas</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Latest snapshot */}
            {latest && (
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>ÚLTIMA MEDICIÓN — {fmtDate(latest.logDate)}</Text>
                <View style={styles.snapshotGrid}>
                  {[
                    { label: "Peso", value: latest.weightKg, unit: "kg", d: prev ? delta(latest.weightKg, prev.weightKg) : null },
                    { label: "Cintura", value: latest.waistCm, unit: "cm", d: prev ? delta(latest.waistCm, prev.waistCm) : null },
                    { label: "Pecho", value: latest.chestCm, unit: "cm", d: prev ? delta(latest.chestCm, prev.chestCm) : null },
                    { label: "Cadera", value: latest.hipsCm, unit: "cm", d: prev ? delta(latest.hipsCm, prev.hipsCm) : null },
                    { label: "Brazo", value: latest.armCm, unit: "cm", d: prev ? delta(latest.armCm, prev.armCm) : null },
                  ].filter((s) => s.value).map((s) => (
                    <View key={s.label} style={styles.snapshotStat}>
                      <Text style={styles.snapshotValue}>{parseFloat(s.value!).toFixed(1)}</Text>
                      <Text style={styles.snapshotUnit}>{s.unit}</Text>
                      <Text style={styles.snapshotStatLabel}>{s.label}</Text>
                      {s.d !== null && (
                        <Text style={[
                          styles.snapshotDelta,
                          s.label === "Peso" || s.label === "Cintura" || s.label === "Cadera"
                            ? s.d < 0 ? styles.deltaGood : s.d > 0 ? styles.deltaBad : styles.deltaNeutral
                            : s.d > 0 ? styles.deltaGood : s.d < 0 ? styles.deltaBad : styles.deltaNeutral,
                        ]}>
                          {s.d > 0 ? "+" : ""}{s.d.toFixed(1)}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Charts */}
            {measurements.length >= 2 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>EVOLUCIÓN EN EL TIEMPO</Text>
                <View style={styles.chartsGrid}>
                  <MiniChart values={weights} label="Peso (kg)" color={Colors.gold} />
                  <MiniChart values={waists} label="Cintura (cm)" color="#60a5fa" />
                  <MiniChart values={chests} label="Pecho (cm)" color="#a78bfa" />
                  <MiniChart values={arms} label="Brazo (cm)" color={Colors.green} />
                </View>
              </View>
            )}

            {/* History */}
            {measurements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>HISTORIAL</Text>
                {measurements.map((m) => (
                  <View key={m.id} style={styles.historyCard}>
                    <Text style={styles.historyDate}>{fmtDate(m.logDate)}</Text>
                    <View style={styles.historyChips}>
                      {m.weightKg && <View style={styles.chip}><Text style={styles.chipText}>{parseFloat(m.weightKg).toFixed(1)} kg</Text></View>}
                      {m.waistCm && <View style={styles.chip}><Text style={styles.chipText}>Cin {parseFloat(m.waistCm).toFixed(0)} cm</Text></View>}
                      {m.chestCm && <View style={styles.chip}><Text style={styles.chipText}>Pec {parseFloat(m.chestCm).toFixed(0)} cm</Text></View>}
                      {m.hipsCm && <View style={styles.chip}><Text style={styles.chipText}>Cad {parseFloat(m.hipsCm).toFixed(0)} cm</Text></View>}
                      {m.armCm && <View style={styles.chip}><Text style={styles.chipText}>Bra {parseFloat(m.armCm).toFixed(0)} cm</Text></View>}
                    </View>
                    {m.notes && <Text style={styles.historyNotes}>{m.notes}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Empty state */}
            {measurements.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Sin registros aún</Text>
                <Text style={styles.emptyText}>
                  Registra tus medidas semanalmente para ver tu transformación a lo largo del tiempo.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+ Registrar medidas</Text>
      </TouchableOpacity>

      <LogFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSaved={load}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 100 },

  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  backBtn: { marginBottom: 16 },
  backText: { color: Colors.gold, fontSize: 14, fontWeight: "600" },
  headerSede: {
    color: Colors.gold, fontSize: 10, fontWeight: "700",
    letterSpacing: 3, fontFamily: "Cinzel_700Bold", marginBottom: 6,
  },
  headerTitle: { color: Colors.text, fontSize: 26, fontWeight: "800" },

  snapshotCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    padding: 16,
  },
  snapshotLabel: {
    color: Colors.gold, fontSize: 9, fontWeight: "700",
    letterSpacing: 2, fontFamily: "Cinzel_700Bold", marginBottom: 16,
  },
  snapshotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  snapshotStat: { alignItems: "center", minWidth: 60 },
  snapshotValue: { color: Colors.text, fontSize: 22, fontWeight: "800" },
  snapshotUnit: { color: Colors.gold, fontSize: 11, fontWeight: "600" },
  snapshotStatLabel: { color: Colors.dim, fontSize: 10, marginTop: 2 },
  snapshotDelta: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  deltaGood: { color: Colors.green },
  deltaBad: { color: "#ef4444" },
  deltaNeutral: { color: Colors.dim },

  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionLabel: {
    color: Colors.gold, fontSize: 9, fontWeight: "700",
    letterSpacing: 2, fontFamily: "Cinzel_700Bold", marginBottom: 16,
  },
  chartsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },

  historyCard: {
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 10,
  },
  historyDate: { color: Colors.text, fontSize: 13, fontWeight: "700", marginBottom: 8 },
  historyChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    backgroundColor: Colors.card2, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  chipText: { color: Colors.dim, fontSize: 11, fontWeight: "500" },
  historyNotes: { color: Colors.dim, fontSize: 12, marginTop: 8, fontStyle: "italic" },

  empty: { paddingHorizontal: 32, paddingTop: 40, alignItems: "center", gap: 12 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: "700" },
  emptyText: { color: Colors.dim, fontSize: 13, textAlign: "center", lineHeight: 20 },

  fab: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: "#000", fontWeight: "700", fontSize: 15 },
});
