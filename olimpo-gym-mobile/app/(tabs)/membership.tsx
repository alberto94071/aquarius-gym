import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Colors } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { MembershipCard } from "@/components/MembershipCard";
import { GroupCard } from "@/components/GroupCard";
import { StatusBadge } from "@/components/StatusBadge";
import type { Member, Payment } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getPaidMonths(payments: Payment[]): string[] {
  const paid: string[] = [];
  for (const p of payments) {
    if (!p.periodStart || !p.periodEnd) continue;
    const d1 = new Date(p.periodStart + "T00:00:00");
    d1.setDate(d1.getDate() + 1);
    const d2 = new Date(p.periodEnd + "T00:00:00");
    const c = new Date(d1.getFullYear(), d1.getMonth(), 1);
    while (c <= d2) {
      const k = `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}`;
      if (!paid.includes(k)) paid.push(k);
      c.setMonth(c.getMonth() + 1);
    }
  }
  return paid;
}

function periodLabel(periodStart: string | null | undefined, periodEnd: string | null | undefined): string {
  if (!periodStart || !periodEnd) return "";
  const d1 = new Date(periodStart + "T00:00:00");
  d1.setDate(d1.getDate() + 1);
  const d2 = new Date(periodEnd + "T00:00:00");
  if (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()) {
    return `${MONTHS_FULL[d1.getMonth()]} ${d1.getFullYear()}`;
  }
  if (d1.getFullYear() === d2.getFullYear()) {
    return `${MONTHS_SHORT[d1.getMonth()]} – ${MONTHS_SHORT[d2.getMonth()]} ${d2.getFullYear()}`;
  }
  return `${MONTHS_SHORT[d1.getMonth()]} ${d1.getFullYear()} – ${MONTHS_SHORT[d2.getMonth()]} ${d2.getFullYear()}`;
}

function ShieldIcon({ color = Colors.gold, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MembershipScreen() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Member>("/api/mobile/me");
      setMember(data);
    } catch (err) {
      console.error("Membership load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.gold} size="large" /></View>;
  }

  if (!member) {
    return <View style={styles.loader}><Text style={styles.dim}>No se pudo cargar la información.</Text></View>;
  }

  const paidMonths = getPaidMonths(member.paymentHistory);
  const endDate = new Date(member.membershipEnd + "T00:00:00");
  const nextMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}><ShieldIcon size={22} /></View>
        <Text style={styles.pageTitle}>Membresía</Text>
      </View>
      <View style={styles.headerDivider} />

      {/* Card */}
      <View style={styles.section}>
        <MembershipCard member={member} />
      </View>

      {/* ─── Paid months ─── */}
      {paidMonths.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MESES PAGADOS</Text>
          <View style={styles.paidCard}>
            <View style={styles.paidSummaryRow}>
              <View style={styles.paidSummaryItem}>
                <Text style={styles.paidSummaryLabel}>Pagado hasta</Text>
                <Text style={styles.paidSummaryValue}>
                  {MONTHS_FULL[endDate.getMonth()]} {endDate.getFullYear()}
                </Text>
              </View>
              <View style={styles.paidSummaryDivider} />
              <View style={styles.paidSummaryItem}>
                <Text style={styles.paidSummaryLabel}>Próximo cobro</Text>
                <Text style={[styles.paidSummaryValue, { color: Colors.gold }]}>
                  {MONTHS_SHORT[nextMonth.getMonth()]} {nextMonth.getFullYear()}
                </Text>
              </View>
            </View>
            <View style={styles.paidMonthsWrap}>
              {paidMonths.map((m) => {
                const [y, mo] = m.split("-").map(Number);
                return (
                  <View key={m} style={styles.monthBadge}>
                    <Text style={styles.monthBadgeText}>{MONTHS_SHORT[mo - 1]} {y}</Text>
                  </View>
                );
              })}
              <View style={[styles.monthBadge, styles.nextMonthBadge]}>
                <Text style={[styles.monthBadgeText, styles.nextMonthBadgeText]}>
                  → {MONTHS_SHORT[nextMonth.getMonth()]} {nextMonth.getFullYear()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DETALLES DEL PLAN</Text>
        <View style={styles.detailCard}>
          <Row label="Plan" value={member.plan.charAt(0).toUpperCase() + member.plan.slice(1)} />
          <Row label="Precio" value={`Q${parseFloat(member.price).toFixed(2)}`} />
          <Row label="Sede" value={member.gym.name ?? "—"} />
          <Row label="Inicio" value={formatDate(member.membershipStart)} />
          <Row label="Vencimiento" value={formatDate(member.membershipEnd)} />
          <View style={[styles.rowItem, styles.lastRow]}>
            <Text style={styles.rowLabel}>Estado</Text>
            <StatusBadge status={member.status} size="sm" />
          </View>
        </View>
      </View>

      {/* Group */}
      {member.group && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GRUPO FAMILIAR</Text>
          <GroupCard group={member.group} />
        </View>
      )}

      {/* Payment history */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>HISTORIAL DE PAGOS</Text>
        {member.paymentHistory.length === 0 ? (
          <Text style={styles.dim}>No hay pagos registrados.</Text>
        ) : (
          <View style={styles.detailCard}>
            {member.paymentHistory.map((p, i) => {
              const period = periodLabel(p.periodStart, p.periodEnd);
              return (
                <View key={p.id} style={[styles.paymentRow, i > 0 && styles.paymentBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentAmount}>Q{parseFloat(p.amount).toFixed(2)}</Text>
                    <Text style={styles.paymentDate}>{formatDate(p.date)}</Text>
                    {period ? (
                      <View style={styles.periodBadge}>
                        <Text style={styles.periodBadgeText}>{period}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <View style={[styles.methodBadge, p.method === "efectivo" ? styles.cash : styles.transfer]}>
                      <Text style={styles.methodText}>
                        {p.method === "efectivo" ? "Efectivo" : "Transferencia"}
                      </Text>
                    </View>
                    {p.notes ? <Text style={styles.paymentNote} numberOfLines={1}>{p.notes}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  loader: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.gold + "18",
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: { color: Colors.text, fontSize: 22, fontWeight: "800", fontFamily: "Cinzel_700Bold" },
  headerDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 24, marginBottom: 20 },

  section: { paddingHorizontal: 24, marginBottom: 28 },
  sectionLabel: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    fontFamily: "Cinzel_700Bold",
    marginBottom: 12,
  },

  // Paid months card
  paidCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    overflow: "hidden",
  },
  paidSummaryRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paidSummaryItem: { flex: 1, padding: 14, alignItems: "center" },
  paidSummaryDivider: { width: 1, backgroundColor: Colors.border },
  paidSummaryLabel: { color: Colors.dim, fontSize: 11, marginBottom: 4 },
  paidSummaryValue: { color: Colors.text, fontSize: 14, fontWeight: "700" },
  paidMonthsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 14,
  },
  monthBadge: {
    backgroundColor: Colors.green + "20",
    borderWidth: 1,
    borderColor: Colors.green + "40",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  monthBadgeText: { color: Colors.green, fontSize: 11, fontWeight: "700" },
  nextMonthBadge: {
    backgroundColor: Colors.gold + "15",
    borderColor: Colors.gold + "50",
  },
  nextMonthBadgeText: { color: Colors.gold },

  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: { color: Colors.dim, fontSize: 13 },
  rowValue: { color: Colors.text, fontSize: 13, fontWeight: "600" },
  dim: { color: Colors.dim, fontSize: 14 },

  paymentRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  paymentBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  paymentAmount: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  paymentDate: { color: Colors.dim, fontSize: 12, marginTop: 2 },
  periodBadge: {
    marginTop: 6,
    backgroundColor: Colors.green + "20",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  periodBadgeText: { color: Colors.green, fontSize: 11, fontWeight: "700" },
  paymentNote: { color: Colors.dim, fontSize: 11, maxWidth: 120, marginTop: 2 },
  methodBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 3 },
  cash: { backgroundColor: Colors.green + "25" },
  transfer: { backgroundColor: Colors.blue + "25" },
  methodText: { color: Colors.text, fontSize: 11, fontWeight: "600" },
});
