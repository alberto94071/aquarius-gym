import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { Colors } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { registerForPushNotifications } from "@/lib/push";
import type { Member } from "@/lib/types";

function UserIcon({ color = Colors.gold, size = 32 }: { color?: string; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

function BellIcon({ color = Colors.dim, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

function LogoutIcon({ color = Colors.red, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="M16 17l5-5-5-5" />
      <Line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  );
}

function RulerIcon({ color = Colors.gold, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 12h20M2 12l4-4M2 12l4 4M22 12l-4-4M22 12l-4 4" />
    </Svg>
  );
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Member>("/api/mobile/me");
      setMember(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleNotifications(value: boolean) {
    setNotificationsEnabled(value);
    if (value) await registerForPushNotifications();
  }

  function handleLogout() {
    Alert.alert("Cerrar sesión", "¿Estás seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: logout },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            {member?.photoUrl ? (
              <Image source={{ uri: member.photoUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <UserIcon size={36} />
              </View>
            )}
          </View>
        </View>

        <Text style={styles.memberName}>{member?.name}</Text>
        <Text style={styles.memberCode}>{member?.code}</Text>
        <View style={styles.gymBadge}>
          <Text style={styles.gymBadgeText}>{member?.gym?.name}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.heroDivider} />

      {/* Personal info */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>INFORMACIÓN PERSONAL</Text>
        <View style={styles.card}>
          <InfoRow label="Correo" value={member?.email ?? "—"} />
          <InfoRow label="Teléfono" value={member?.phone ?? "—"} />
          <InfoRow
            label="Nacimiento"
            value={member?.birthDate ? formatDate(member.birthDate) : "—"}
          />
          <InfoRow
            label="Sexo"
            value={member?.sex === "M" ? "Masculino" : "Femenino"}
            last
          />
        </View>
      </View>

      {/* Body tracking */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SEGUIMIENTO</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push("/measurements" as never)}
            activeOpacity={0.75}
          >
            <View style={styles.settingLeft}>
              <RulerIcon />
              <Text style={styles.settingText}>Mis medidas corporales</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CONFIGURACIÓN</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <BellIcon />
              <Text style={styles.settingText}>Notificaciones push</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: Colors.border, true: Colors.gold + "60" }}
              thumbColor={notificationsEnabled ? Colors.gold : Colors.dim}
            />
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogoutIcon />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 48 },
  loader: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },

  hero: {
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: Colors.gold + "0F",
  },
  avatarInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: "hidden",
    backgroundColor: Colors.card,
  },
  avatar: { width: 92, height: 92 },
  avatarPlaceholder: {
    backgroundColor: Colors.card2,
    alignItems: "center",
    justifyContent: "center",
  },
  memberName: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
    fontFamily: "Cinzel_700Bold",
  },
  memberCode: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  gymBadge: {
    backgroundColor: Colors.gold + "18",
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  gymBadgeText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  heroDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 24,
    marginBottom: 24,
  },

  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionLabel: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    fontFamily: "Cinzel_700Bold",
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { color: Colors.dim, fontSize: 13 },
  infoValue: { color: Colors.text, fontSize: 13, fontWeight: "600", maxWidth: "60%" },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingText: { color: Colors.text, fontSize: 14 },

  chevron: { color: Colors.dim, fontSize: 20, fontWeight: "300" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.red + "50",
    borderRadius: 12,
    padding: 16,
  },
  logoutText: { color: Colors.red, fontSize: 15, fontWeight: "700" },
});
