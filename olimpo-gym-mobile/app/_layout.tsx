import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Colors } from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { member, loading, termsAcceptanceRequired } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded] = useFonts({ Cinzel_700Bold });

  useEffect(() => {
    if (!loading && fontsLoaded) SplashScreen.hideAsync();
  }, [loading, fontsLoaded]);

  useEffect(() => {
    if (loading || !fontsLoaded) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inTerms = segments[0] === "terms";

    if (!member && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (member && termsAcceptanceRequired && !inTerms) {
      // Bloquea el acceso a cualquier pantalla hasta que acepte los términos
      router.replace("/terms");
    } else if (member && !termsAcceptanceRequired && (inAuthGroup || inTerms)) {
      router.replace("/(tabs)");
    }
  }, [member, loading, fontsLoaded, segments, termsAcceptanceRequired]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.type === "birthday") {
        const name = typeof data.memberName === "string" ? data.memberName : "";
        router.push({ pathname: "/birthday", params: { name } });
      } else if (data?.type === "announcement") {
        router.push("/(tabs)/announcements" as never);
      }
    });
    return () => sub.remove();
  }, [router]);

  return (
    <>
      {/* Stack SIEMPRE montado — necesario para que router.push funcione */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="terms" options={{ gestureEnabled: false }} />
        <Stack.Screen name="announcement/[id]" />
        <Stack.Screen name="birthday" />
        <Stack.Screen name="measurements" />
      </Stack>

      {/* Loader como overlay mientras carga — no desmonta el Stack */}
      {(loading || !fontsLoaded) && (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
