import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Colors } from "@/constants/colors";
import type { Announcement } from "@/lib/types";

function MegaphoneIcon({ color = Colors.gold, size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 11l18-5v12L3 13v-2z" />
      <Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </Svg>
  );
}

function PinIcon({ color = Colors.gold, size = 12 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-GT", { day: "2-digit", month: "short" });
}

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

/** Texto plano para la vista previa: quita <style>/<script> COMPLETOS (no solo
 * las etiquetas, para que el CSS/JS interno no se filtre como texto), el resto
 * de las etiquetas HTML, y decodifica las entidades más comunes. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => HTML_ENTITIES[m] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, announcement.pinned && styles.cardPinned]}
      activeOpacity={0.8}
      onPress={() => router.push(`/announcement/${announcement.id}` as never)}
    >
      {/* Pinned banner */}
      {announcement.pinned && (
        <View style={styles.pinnedBanner}>
          <PinIcon size={10} color={Colors.gold} />
          <Text style={styles.pinnedText}>FIJADO</Text>
        </View>
      )}

      {/* Image */}
      {announcement.imageUrl && (
        <Image source={{ uri: announcement.imageUrl }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.row}>
        <View style={styles.accentBar} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.iconWrap}>
              <MegaphoneIcon />
            </View>
            <Text style={styles.title} numberOfLines={2}>{announcement.title}</Text>
            {announcement.gymName && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{announcement.gymName}</Text>
              </View>
            )}
          </View>
          <Text style={styles.bodyText} numberOfLines={3}>
            {stripHtml(announcement.body)}
          </Text>
          <Text style={styles.date}>{formatRelative(announcement.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardPinned: {
    borderColor: Colors.gold + "40",
  },
  pinnedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.gold + "15",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold + "25",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pinnedText: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  image: {
    width: "100%",
    height: 160,
  },
  row: {
    flexDirection: "row",
  },
  accentBar: {
    width: 4,
    backgroundColor: Colors.gold,
  },
  body: {
    flex: 1,
    padding: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: { marginTop: 2 },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: Colors.gold + "25",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeText: { color: Colors.gold, fontSize: 10, fontWeight: "600" },
  bodyText: { color: Colors.dim, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  date: { color: Colors.dim + "80", fontSize: 11, fontWeight: "500" },
});
