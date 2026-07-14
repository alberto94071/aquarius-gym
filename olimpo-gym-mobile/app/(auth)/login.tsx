import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Colors } from "@/constants/colors";
import { GOOGLE_CLIENT_ID } from "@/constants/config";
import { useAuth, ApiError } from "@/lib/auth";

GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID,
});

export default function LoginScreen() {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"google" | "email">("google");

  // Email/password form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try { await GoogleSignin.signOut(); } catch {} // force account picker
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error("No se obtuvo el token de Google.");
      await loginWithGoogle(idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        // usuario canceló
      } else if (code === statusCodes.IN_PROGRESS) {
        // ya en progreso
      } else if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services no está disponible.");
      } else if (code === "DEVELOPER_ERROR") {
        // Configuración de Google Cloud incorrecta (SHA-1/package del OAuth client)
        Alert.alert(
          "Configuración pendiente",
          "El inicio con Google no está configurado para esta versión de la app (SHA-1/package). Usa el acceso con correo mientras tanto."
        );
      } else if (err instanceof ApiError) {
        const msg =
          err.status === 404
            ? "No estás inscrito en Aquarius Gym. Contacta a tu sede."
            : err.message;
        Alert.alert("Acceso denegado", msg);
      } else {
        Alert.alert("Error", "Error al iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email.trim().toLowerCase(), password);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const msg =
          err.status === 401
            ? "Correo o contraseña incorrectos."
            : err.status === 404
            ? "No estás inscrito en Aquarius Gym. Contacta a tu sede."
            : err.message;
        Alert.alert("Acceso denegado", msg);
      } else {
        Alert.alert("Error", "Error al iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoTitle}>AQUARIUS</Text>
          <Text style={styles.logoSubtitle}>GYM</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>Entrena sin límites.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.welcomeText}>Bienvenido</Text>

          {/* Toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === "google" && styles.toggleBtnActive]}
              onPress={() => setMode("google")}
            >
              <Text style={[styles.toggleText, mode === "google" && styles.toggleTextActive]}>
                Google
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === "email" && styles.toggleBtnActive]}
              onPress={() => setMode("email")}
            >
              <Text style={[styles.toggleText, mode === "email" && styles.toggleTextActive]}>
                Correo
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "google" ? (
            <>
              <Text style={styles.instructionText}>
                Inicia sesión con tu cuenta de Google para acceder a tu membresía.
              </Text>
              <TouchableOpacity
                style={[styles.googleButton, loading && styles.disabled]}
                onPress={handleGoogleSignIn}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.bg} />
                ) : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleButtonText}>Iniciar sesión con Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.instructionText}>
                Ingresa tu código de carné o correo, y la contraseña que te dio el gimnasio.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Código de carné o correo"
                placeholderTextColor={Colors.dim}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={Colors.dim}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.emailButton, loading && styles.disabled]}
                onPress={handleEmailLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.emailButtonText}>Ingresar</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.disclaimer}>Solo para miembros inscritos</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoTitle: {
    fontSize: 52,
    fontWeight: "900",
    color: Colors.gold,
    letterSpacing: 12,
  },
  logoSubtitle: {
    fontSize: 28,
    fontWeight: "300",
    color: Colors.text,
    letterSpacing: 16,
    marginTop: -8,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: Colors.gold,
    marginVertical: 16,
  },
  tagline: {
    color: Colors.dim,
    fontSize: 13,
    letterSpacing: 1,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  welcomeText: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.bg,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: Colors.gold,
  },
  toggleText: {
    color: Colors.dim,
    fontWeight: "600",
    fontSize: 14,
  },
  toggleTextActive: {
    color: Colors.bg,
  },
  instructionText: {
    color: Colors.dim,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    justifyContent: "center",
    gap: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleButtonText: {
    color: "#1F1F1F",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: Colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  emailButton: {
    backgroundColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginTop: 4,
  },
  emailButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  disclaimer: {
    color: Colors.dim,
    fontSize: 12,
    marginTop: 16,
  },
});
