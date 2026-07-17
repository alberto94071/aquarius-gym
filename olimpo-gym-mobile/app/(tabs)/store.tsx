import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { Colors } from "@/constants/colors";
import { apiFetch } from "@/lib/api";

interface StoreProduct {
  id: string;
  name: string;
  category: string | null;
  salePrice: string;
  stock: number;
  imageUrl: string | null;
}

interface DebtItem {
  id: string;
  quantity: number;
  total: string;
  amountPaid: string;
  saldo: string;
  status: string;
  saleDate: string;
  productName: string;
  abonos: { amount: string; paymentDate: string }[];
}

function CartIcon({ color = Colors.gold, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="9" cy="21" r="1" />
      <Circle cx="20" cy="21" r="1" />
      <Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </Svg>
  );
}

const Q = (n: number | string) => `Q${Number(n).toFixed(2)}`;

export default function StoreScreen() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [totalDebt, setTotalDebt] = useState("0");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ordering, setOrdering] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [store, debtsRes] = await Promise.all([
        apiFetch<{ products: StoreProduct[] }>("/api/mobile/store"),
        apiFetch<{ items: DebtItem[]; totalDebt: string }>("/api/mobile/debts"),
      ]);
      setProducts(store.products);
      setDebts(debtsRes.items);
      setTotalDebt(debtsRes.totalDebt);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function confirmOrder(p: StoreProduct) {
    Alert.alert(
      `Apartar ${p.name}`,
      `Precio: ${Q(p.salePrice)}\n\nAl apartar te comprometes a pagarlo en tu sede (puedes darlo en abonos). Si no lo pagas, el saldo se sumará a tu siguiente mensualidad.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apartar",
          onPress: async () => {
            setOrdering(p.id);
            try {
              const res = await apiFetch<{ success: boolean; message: string }>("/api/mobile/store/order", {
                method: "POST",
                body: JSON.stringify({ productId: p.id, quantity: 1 }),
              });
              Alert.alert("✅ Apartado", res.message);
              await load();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "No se pudo apartar");
            } finally {
              setOrdering(null);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.gold} size="large" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
    >
      <Text style={styles.title}>Tienda</Text>
      <Text style={styles.subtitle}>Aparta productos y recógelos en tu sede</Text>

      {/* ── Cuentas pendientes ── */}
      {debts.length > 0 && (
        <View style={styles.debtCard}>
          <View style={styles.debtHeader}>
            <Text style={styles.debtTitle}>💳 Cuentas pendientes</Text>
            <Text style={styles.debtTotal}>{Q(totalDebt)}</Text>
          </View>
          {debts.map((d) => (
            <View key={d.id} style={styles.debtRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.debtProduct}>{d.quantity}× {d.productName}</Text>
                <Text style={styles.debtDetail}>
                  Total {Q(d.total)} · Abonado {Q(d.amountPaid)}
                </Text>
              </View>
              <Text style={styles.debtSaldo}>{Q(d.saldo)}</Text>
            </View>
          ))}
          <Text style={styles.debtNote}>
            Puedes abonar en tu sede. Lo que no pagues se sumará a tu siguiente mensualidad.
          </Text>
        </View>
      )}

      {/* ── Productos ── */}
      <View style={styles.grid}>
        {products.map((p) => (
          <View key={p.id} style={styles.card}>
            {p.imageUrl ? (
              <Image source={{ uri: p.imageUrl }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <CartIcon size={26} color={Colors.dim} />
              </View>
            )}
            <View style={styles.cardBody}>
              {p.category && <Text style={styles.cardCategory}>{p.category.toUpperCase()}</Text>}
              <Text style={styles.cardName} numberOfLines={2}>{p.name}</Text>
              <Text style={styles.cardPrice}>{Q(p.salePrice)}</Text>
              <Text style={styles.cardStock}>{p.stock} disponibles</Text>
              <TouchableOpacity
                style={[styles.buyBtn, ordering === p.id && { opacity: 0.5 }]}
                disabled={ordering !== null}
                onPress={() => confirmOrder(p)}
                activeOpacity={0.8}
              >
                {ordering === p.id
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={styles.buyBtnText}>Apartar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {products.length === 0 && (
        <View style={styles.empty}>
          <CartIcon size={40} color={Colors.dim} />
          <Text style={styles.emptyTitle}>Tienda vacía por ahora</Text>
          <Text style={styles.emptyText}>Pronto habrá aguas, bebidas y suplementos disponibles.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  loader: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },
  title: { color: Colors.gold, fontSize: 26, fontWeight: "900", letterSpacing: 1 },
  subtitle: { color: Colors.dim, fontSize: 13, marginTop: 2, marginBottom: 16 },

  debtCard: {
    backgroundColor: Colors.red + "10",
    borderWidth: 1,
    borderColor: Colors.red + "50",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  debtHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  debtTitle: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  debtTotal: { color: Colors.red, fontSize: 18, fontWeight: "900" },
  debtRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  debtProduct: { color: Colors.text, fontSize: 13, fontWeight: "700" },
  debtDetail: { color: Colors.dim, fontSize: 11, marginTop: 1 },
  debtSaldo: { color: Colors.red, fontSize: 14, fontWeight: "800" },
  debtNote: { color: Colors.dim, fontSize: 11, marginTop: 8, fontStyle: "italic" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47.5%",
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 100 },
  cardImagePlaceholder: {
    width: "100%", height: 100, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.card2,
  },
  cardBody: { padding: 12 },
  cardCategory: { color: Colors.dim, fontSize: 9, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  cardName: { color: Colors.text, fontSize: 14, fontWeight: "700", minHeight: 36 },
  cardPrice: { color: Colors.gold, fontSize: 18, fontWeight: "900", marginTop: 4 },
  cardStock: { color: Colors.dim, fontSize: 11, marginBottom: 8 },
  buyBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  buyBtnText: { color: "#000", fontWeight: "800", fontSize: 13 },

  empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  emptyText: { color: Colors.dim, fontSize: 13, textAlign: "center" },
});
