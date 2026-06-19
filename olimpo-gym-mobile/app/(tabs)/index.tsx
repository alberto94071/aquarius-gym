import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { Colors } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { HomeContentItem } from "@/lib/types";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BoltIcon({ color = Colors.gold, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1}>
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  );
}

function ShieldIcon({ color = Colors.gold, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

function DumbbellIcon({ color = Colors.gold, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 5v14M18 5v14M6 8h12M6 16h12" />
      <Rect x="2" y="6" width="4" height="12" rx="2" />
      <Rect x="18" y="6" width="4" height="12" rx="2" />
    </Svg>
  );
}

function PlayIcon({ color = Colors.gold, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M10 8l6 4-6 4V8z" fill={color} />
    </Svg>
  );
}

function ArticleIcon({ color = Colors.gold, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </Svg>
  );
}

function LightbulbIcon({ color = Colors.gold, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 3-2 5.5-3 7H9c-1-1.5-3-4-3-7a6 6 0 0 1 6-6z" />
    </Svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function GoldDivider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <View style={styles.dividerDiamond} />
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────

function ContentCard({ item }: { item: HomeContentItem }) {
  const ytId = item.type === "video" && item.url ? getYouTubeId(item.url) : null;
  const thumbUrl = ytId
    ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
    : item.imageUrl ?? null;

  function handlePress() {
    if (item.url) Linking.openURL(item.url);
  }

  const TypeIcon =
    item.type === "video" ? PlayIcon :
    item.type === "article" ? ArticleIcon :
    LightbulbIcon;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={item.url ? 0.75 : 1}
      style={styles.contentCard}
    >
      {thumbUrl && (
        <Image
          source={{ uri: thumbUrl }}
          style={styles.contentCardImage}
          resizeMode="cover"
        />
      )}
      {!thumbUrl && (
        <View style={styles.contentCardImagePlaceholder}>
          <TypeIcon size={28} />
        </View>
      )}
      {/* Play overlay for videos */}
      {item.type === "video" && thumbUrl && (
        <View style={styles.playOverlay}>
          <View style={styles.playCircle}>
            <PlayIcon size={18} color="#000" />
          </View>
        </View>
      )}
      <View style={styles.contentCardBody}>
        <View style={styles.contentCardTypeBadge}>
          <TypeIcon size={10} color={Colors.gold} />
          <Text style={styles.contentCardTypeText}>
            {item.type === "video" ? "Video" : item.type === "article" ? "Artículo" : "Tip"}
          </Text>
        </View>
        <Text style={styles.contentCardTitle} numberOfLines={2}>{item.title}</Text>
        {item.body && <Text style={styles.contentCardBody2} numberOfLines={2}>{item.body}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ─── Notice Card ──────────────────────────────────────────────────────────────

function BellIcon({ color = Colors.gold, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

function NoticeCard({ item }: { item: HomeContentItem }) {
  return (
    <View style={noticeStyles.card}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={noticeStyles.image} resizeMode="cover" />
      )}
      <View style={noticeStyles.body}>
        <View style={noticeStyles.badge}>
          <BellIcon size={10} color={Colors.gold} />
          <Text style={noticeStyles.badgeText}>AVISO</Text>
        </View>
        <Text style={noticeStyles.title}>{item.title}</Text>
        {item.body && <Text style={noticeStyles.bodyText}>{item.body}</Text>}
      </View>
    </View>
  );
}

const noticeStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.gold + "10",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    overflow: "hidden",
    marginBottom: 12,
  },
  image: { width: "100%", height: 160 },
  body: { padding: 14 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  badgeText: { color: Colors.gold, fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: Colors.text, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  bodyText: { color: Colors.dim, fontSize: 12, marginTop: 4, lineHeight: 18 },
});

// ─── Quick Action Card ─────────────────────────────────────────────────────────

function QuickActionCard({
  icon,
  label,
  sublabel,
  onPress,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.quickCard, accent && styles.quickCardAccent]}>
      <View style={styles.quickCardIcon}>{icon}</View>
      <Text style={styles.quickCardLabel}>{label}</Text>
      <Text style={styles.quickCardSublabel}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

// ─── Static Motivational Quotes ───────────────────────────────────────────────

const QUOTES = [
  { text: "El dolor que sientes hoy será la fuerza que sentirás mañana.", author: "Anónimo" },
  { text: "La disciplina es el puente entre metas y logros.", author: "Jim Rohn" },
  { text: "No cuentes los días. Haz que los días cuenten.", author: "Muhammad Ali" },
  { text: "El cuerpo logra lo que la mente cree.", author: "Anónimo" },
  { text: "Forja tu cuerpo como los dioses del Olimpo forjaron el mundo.", author: "Olimpo Gym" },
];

function todayQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { member: authMember } = useAuth();
  const router = useRouter();

  const [content, setContent] = useState<HomeContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const quote = todayQuote();

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ content: HomeContentItem[] }>("/api/mobile/home-content");
      setContent(data.content ?? []);
    } catch {
      setContent([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const notices = content.filter((c) => c.type === "notice");
  const videos = content.filter((c) => c.type === "video");
  const articles = content.filter((c) => c.type === "article");
  const tips = content.filter((c) => c.type === "tip" || c.type === "image");

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSede}>OLIMPO GYM</Text>
            <Text style={styles.headerGreeting}>
              Hola, {authMember?.name?.split(" ")[0] ?? "Atleta"} 👋
            </Text>
          </View>
          <View style={styles.headerIconCircle}>
            <BoltIcon size={22} />
          </View>
        </View>
        <GoldDivider />
      </View>

      {/* ─── Quick Actions ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCESO RÁPIDO</Text>
        <View style={styles.quickGrid}>
          <QuickActionCard
            icon={<DumbbellIcon size={22} />}
            label="Rutina de hoy"
            sublabel="Ver mi entrenamiento"
            onPress={() => router.push("/(tabs)/routines" as never)}
            accent
          />
          <QuickActionCard
            icon={<ShieldIcon size={22} />}
            label="Membresía"
            sublabel="Estado y pagos"
            onPress={() => router.push("/(tabs)/membership" as never)}
          />
        </View>
      </View>

      {/* ─── Motivational Quote ─── */}
      <View style={[styles.section, styles.quoteSection]}>
        <View style={styles.quoteAccentBar} />
        <View style={styles.quoteBody}>
          <Text style={styles.quoteLabel}>FRASE DEL DÍA</Text>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          <Text style={styles.quoteAuthor}>— {quote.author}</Text>
        </View>
      </View>

      {/* ─── Notices ─── */}
      {notices.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>AVISOS DEL GYM</Text>
            <BellIcon size={14} />
          </View>
          {notices.map((n) => (
            <NoticeCard key={n.id} item={n} />
          ))}
        </View>
      )}

      {/* ─── Videos ─── */}
      {videos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>VIDEOS MOTIVACIONALES</Text>
            <PlayIcon size={14} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {videos.map((v) => (
              <View key={v.id} style={styles.videoCardWrap}>
                <ContentCard item={v} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ─── Tips & Articles ─── */}
      {(articles.length > 0 || tips.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SALUD Y BIENESTAR</Text>
          <View style={styles.articlesList}>
            {[...articles, ...tips].map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </View>
        </View>
      )}

      {/* ─── Empty state ─── */}
      {content.length === 0 && (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>El Olimpo te espera</Text>
          <Text style={styles.emptySubtitle}>Pronto habrá videos motivacionales y artículos de salud para ti.</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 36 },
  loader: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },

  // Header
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 4 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerSede: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    fontFamily: "Cinzel_700Bold",
    marginBottom: 4,
  },
  headerGreeting: { color: Colors.text, fontSize: 26, fontWeight: "800" },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold + "18",
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerDiamond: { width: 6, height: 6, backgroundColor: Colors.gold, transform: [{ rotate: "45deg" }] },

  // Sections
  section: { paddingHorizontal: 24, marginBottom: 28 },
  sectionLabel: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    fontFamily: "Cinzel_700Bold",
    marginBottom: 14,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  // Quick Actions
  quickGrid: { flexDirection: "row", gap: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 6,
  },
  quickCardAccent: {
    backgroundColor: Colors.gold + "12",
    borderColor: Colors.gold + "50",
  },
  quickCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.gold + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  quickCardLabel: { color: Colors.text, fontSize: 13, fontWeight: "700" },
  quickCardSublabel: { color: Colors.dim, fontSize: 11 },

  // Quote
  quoteSection: { paddingHorizontal: 0, marginHorizontal: 24 },
  quoteAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  quoteBody: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    padding: 18,
    paddingLeft: 20,
    marginLeft: 8,
  },
  quoteLabel: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "Cinzel_700Bold",
    marginBottom: 8,
  },
  quoteText: {
    color: Colors.text,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
    fontWeight: "500",
  },
  quoteAuthor: { color: Colors.gold, fontSize: 12, fontWeight: "600", marginTop: 8 },

  // Content cards
  horizontalScroll: { paddingRight: 24, gap: 14 },
  videoCardWrap: { width: 240 },
  contentCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  contentCardImage: { width: "100%", height: 140 },
  contentCardImagePlaceholder: {
    width: "100%",
    height: 90,
    backgroundColor: Colors.card2,
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  contentCardBody: { padding: 12 },
  contentCardTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  contentCardTypeText: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  contentCardTitle: { color: Colors.text, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  contentCardBody2: { color: Colors.dim, fontSize: 11, marginTop: 4, lineHeight: 16 },
  articlesList: { gap: 0 },

  // Empty
  emptyContent: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Cinzel_700Bold",
    letterSpacing: 1,
  },
  emptySubtitle: { color: Colors.dim, fontSize: 13, textAlign: "center", lineHeight: 20 },
});
