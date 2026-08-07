import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Colors } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { HtmlView } from "@/components/HtmlView";

interface TermsDoc {
  version: number;
  title: string;
  contentHtml: string;
}

const SCROLL_END_THRESHOLD = 60;

export default function TermsScreen() {
  const { markTermsAccepted, logout } = useAuth();
  const [doc, setDoc] = useState<TermsDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    apiFetch<TermsDoc>("/api/mobile/legal/terms")
      .then(setDoc)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar los términos"))
      .finally(() => setLoading(false));
  }, []);

  // No se puede salir de esta pantalla con el botón "atrás" de Android sin aceptar
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom <= SCROLL_END_THRESHOLD) setScrolledToEnd(true);
  }, []);

  // Documentos cortos que caben sin necesidad de hacer scroll
  const onContentSizeChange = useCallback((_w: number, h: number) => {
    if (h <= 700) setScrolledToEnd(true);
  }, []);

  async function handleAccept() {
    if (!doc) return;
    setAccepting(true);
    try {
      await apiFetch("/api/mobile/legal/accept", {
        method: "POST",
        body: JSON.stringify({ version: doc.version }),
      });
      markTermsAccepted();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo registrar tu aceptación. Intenta de nuevo.");
    } finally {
      setAccepting(false);
    }
  }

  function handleReject() {
    Alert.alert(
      "Debes aceptar para continuar",
      "Para usar Aquarius Gym es necesario leer y aceptar el consentimiento de riesgo y los términos de uso. Puedes cerrar sesión si no estás de acuerdo.",
      [
        { text: "Volver a leer", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: () => logout() },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (error || !doc) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>{error || "No hay términos disponibles."}</Text>
        <TouchableOpacity onPress={() => logout()} style={{ marginTop: 16 }}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canAccept = scrolledToEnd && checked;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>ANTES DE CONTINUAR</Text>
        <Text style={styles.headerTitle}>{doc.title}</Text>
        {!scrolledToEnd && (
          <Text style={styles.headerHint}>Desplázate hasta el final para poder aceptar</Text>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={100}
      >
        <HtmlView html={doc.contentHtml} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setChecked((c) => !c)}
          activeOpacity={0.7}
          disabled={!scrolledToEnd}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked, !scrolledToEnd && styles.checkboxDisabled]}>
            {checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.checkLabel, !scrolledToEnd && styles.checkLabelDisabled]}>
            He leído y acepto el Consentimiento de Riesgo y los Términos de Uso de Aquarius Gym.
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleReject} style={styles.rejectBtn}>
            <Text style={styles.rejectText}>No acepto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAccept}
            disabled={!canAccept || accepting}
            style={[styles.acceptBtn, (!canAccept || accepting) && styles.acceptBtnDisabled]}
            activeOpacity={0.85}
          >
            {accepting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.acceptText}>Aceptar y continuar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 56 },
  loader: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: Colors.dim, fontSize: 14, textAlign: "center" },
  logoutText: { color: Colors.gold, fontWeight: "700" },

  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerLabel: { color: Colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  headerTitle: { color: Colors.text, fontSize: 20, fontWeight: "800", marginTop: 4 },
  headerHint: { color: Colors.dim, fontSize: 12, marginTop: 6 },

  scroll: { flex: 1, borderTopWidth: 1, borderTopColor: Colors.border },
  scrollContent: { padding: 20, paddingBottom: 40 },

  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: Colors.card,
    gap: 14,
  },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: Colors.gold,
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.gold },
  checkboxDisabled: { borderColor: Colors.dim, opacity: 0.5 },
  checkmark: { color: "#000", fontWeight: "900", fontSize: 14 },
  checkLabel: { flex: 1, color: Colors.text, fontSize: 13, lineHeight: 19 },
  checkLabelDisabled: { color: Colors.dim },

  buttonRow: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  rejectText: { color: Colors.dim, fontWeight: "700", fontSize: 14 },
  acceptBtn: { flex: 1, backgroundColor: Colors.gold, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  acceptBtnDisabled: { opacity: 0.4 },
  acceptText: { color: "#000", fontWeight: "800", fontSize: 14 },
});
