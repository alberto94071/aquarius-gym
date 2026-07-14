import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import YoutubePlayer from "react-native-youtube-iframe";
import { Colors } from "@/constants/colors";

/**
 * Reproductor de YouTube dentro de la app: los videos publicados desde el
 * CRM se ven aquí sin sacar al usuario a la app de YouTube.
 */
export default function VideoScreen() {
  const { videoId, title, body } = useLocalSearchParams<{
    videoId: string;
    title?: string;
    body?: string;
  }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [ready, setReady] = useState(false);

  const playerHeight = Math.round(((width - 32) * 9) / 16);

  if (!videoId) {
    return (
      <View style={styles.loader}>
        <Text style={styles.notFound}>Video no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <View style={[styles.playerWrap, { height: playerHeight }]}>
        {!ready && (
          <View style={[styles.playerLoading, { height: playerHeight }]}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        )}
        <YoutubePlayer
          height={playerHeight}
          width={width - 32}
          play={true}
          videoId={videoId}
          onReady={() => setReady(true)}
        />
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : null}
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  loader: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },
  notFound: { color: Colors.dim, fontSize: 16, marginBottom: 12 },
  backBtn: { marginBottom: 16 },
  backText: { color: Colors.gold, fontSize: 15, fontWeight: "600" },
  playerWrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 16,
  },
  playerLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    zIndex: 1,
  },
  title: { color: Colors.text, fontSize: 20, fontWeight: "800", lineHeight: 26, marginBottom: 8 },
  body: { color: Colors.dim, fontSize: 14, lineHeight: 22 },
});
