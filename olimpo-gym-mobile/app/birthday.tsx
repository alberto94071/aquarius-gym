import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

export default function BirthdayScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const router = useRouter();
  const firstName = name ?? "Campeón";

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        <Text style={styles.emoji}>🎂</Text>
        <Text style={styles.title}>¡Feliz Cumpleaños!</Text>
        <Text style={styles.name}>{firstName}</Text>
        <Text style={styles.message}>
          Todo el equipo de{"\n"}
          <Text style={styles.gymName}>Aquarius Gym</Text>
          {"\n"}te desea un día increíble.{"\n"}
          ¡Sigue siendo grande!
        </Text>
        <View style={styles.divider} />
        <Text style={styles.sub}>Con mucho cariño, tu equipo 💪</Text>
      </Animated.View>

      <TouchableOpacity style={styles.button} onPress={() => router.replace("/(tabs)")}>
        <Text style={styles.buttonText}>Ir al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 36,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gold + "50",
    width: "100%",
    shadowColor: Colors.gold,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    color: Colors.gold,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: "center",
  },
  name: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  message: {
    color: Colors.dim,
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
  },
  gymName: {
    color: Colors.gold,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    width: "60%",
    marginVertical: 20,
  },
  sub: {
    color: Colors.dim,
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    marginTop: 32,
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  buttonText: {
    color: Colors.bg,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
