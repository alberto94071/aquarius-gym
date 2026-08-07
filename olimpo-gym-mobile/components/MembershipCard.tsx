import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { Colors } from "@/constants/colors";
import { StatusBadge } from "./StatusBadge";
import type { Member } from "@/lib/types";

const PLAN_DAYS: Record<string, number> = {
  semanal: 7,
  quincenal: 15,
  mensual: 30,
  trimestral: 90,
  anual: 365,
};

export function MembershipCard({ member }: { member: Member }) {
  const [cardSize, setCardSize] = useState({ w: 0, h: 0 });
  const totalDays = PLAN_DAYS[member.plan] ?? 30;
  const progress = Math.min(1, Math.max(0, member.daysRemaining / totalDays));
  const progressPct = Math.round(progress * 100);

  const isBlocked = member.status === "bloqueado" || member.status === "mora";
  const barColor =
    member.daysRemaining > 7
      ? Colors.green
      : member.daysRemaining > 0
      ? Colors.orange
      : Colors.red;

  return (
    <View
      style={[styles.card, isBlocked && styles.cardWarning]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setCardSize({ w: Math.round(width), h: Math.round(height) });
      }}
    >
      {/* Gradient background via react-native-svg */}
      {cardSize.w > 0 && (
        <Svg
          style={StyleSheet.absoluteFill}
          width={cardSize.w}
          height={cardSize.h}
        >
          <Defs>
            <LinearGradient
              id="cardGrad"
              x1="0"
              y1="0"
              x2={cardSize.w}
              y2={cardSize.h}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#231A06" />
              <Stop offset="1" stopColor="#0D0D0D" />
            </LinearGradient>
          </Defs>
          <Rect width={cardSize.w} height={cardSize.h} fill="url(#cardGrad)" />
        </Svg>
      )}

      {/* Gold top stripe */}
      <View style={[styles.topStripe, isBlocked && styles.topStripeWarning]} />

      <View style={styles.content}>
        {/* Plan + Status */}
        <View style={styles.topRow}>
          <View style={styles.planGroup}>
            <Text style={styles.planLabel}>{member.plan.toUpperCase()}</Text>
            <View style={[styles.levelBadge, member.accessLevel === "vip" && styles.levelBadgeVip]}>
              <Text style={[styles.levelBadgeText, member.accessLevel === "vip" && styles.levelBadgeTextVip]}>
                {member.accessLevel === "vip" ? "VIP · 4TO. NIVEL" : "BÁSICO"}
              </Text>
            </View>
          </View>
          <StatusBadge status={member.status} size="sm" />
        </View>

        {/* Days count */}
        <View style={styles.daysRow}>
          <Text style={styles.daysCount}>{member.daysRemaining}</Text>
          <Text style={styles.daysUnit}>{"días\nrestantes"}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPct}%` as `${number}%`, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>{progressPct}% del plan completado</Text>

        {/* Dates */}
        <View style={styles.datesRow}>
          <View>
            <Text style={styles.dateLabel}>INICIO</Text>
            <Text style={styles.dateValue}>{formatDate(member.membershipStart)}</Text>
          </View>
          <View style={styles.dateSeparator} />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.dateLabel}>VENCIMIENTO</Text>
            <Text style={[styles.dateValue, isBlocked && { color: Colors.red }]}>
              {formatDate(member.membershipEnd)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.gold + "45",
    backgroundColor: Colors.card,
  },
  cardWarning: {
    borderColor: Colors.red + "55",
  },
  topStripe: {
    height: 3,
    backgroundColor: Colors.gold,
  },
  topStripeWarning: {
    backgroundColor: Colors.red,
  },
  content: {
    padding: 22,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  planGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planLabel: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    fontFamily: "Cinzel_700Bold",
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
  },
  levelBadgeVip: {
    backgroundColor: Colors.gold,
  },
  levelBadgeText: {
    color: Colors.dim,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  levelBadgeTextVip: {
    color: "#000",
  },
  daysRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 16,
  },
  daysCount: {
    color: Colors.text,
    fontSize: 68,
    fontWeight: "900",
    lineHeight: 68,
    fontFamily: "Cinzel_700Bold",
  },
  daysUnit: {
    color: Colors.dim,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  progressTrack: {
    height: 5,
    backgroundColor: "#2A2A2A",
    borderRadius: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  progressLabel: {
    color: Colors.dim,
    fontSize: 11,
    marginBottom: 20,
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateSeparator: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  dateLabel: {
    color: Colors.dim,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 4,
  },
  dateValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
});
