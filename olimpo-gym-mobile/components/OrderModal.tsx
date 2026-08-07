import React, { useState } from "react";
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Image,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { Colors } from "@/constants/colors";

export interface StoreProduct {
  id: string;
  name: string;
  category: string | null;
  salePrice: string;
  stock: number;
  imageUrl: string | null;
}

export type PaymentIntent = "luego" | "abono" | "mensualidad";

const Q = (n: number | string) => `Q${Number(n).toFixed(2)}`;

const INTENT_OPTIONS: { key: PaymentIntent; title: string; subtitle: string; icon: string }[] = [
  { key: "luego", title: "Lo recojo y pago completo", subtitle: "Pagas todo en efectivo al recogerlo en tu sede", icon: "🏪" },
  { key: "abono", title: "Doy un abono ahora", subtitle: "Indica cuánto abonarás al recogerlo; el resto queda pendiente", icon: "💵" },
  { key: "mensualidad", title: "Que se sume a mi mensualidad", subtitle: "El costo se agrega a tu próximo pago de membresía", icon: "🗓️" },
];

export function OrderModal({
  product,
  onClose,
  onConfirm,
}: {
  product: StoreProduct;
  onClose: () => void;
  onConfirm: (payload: { quantity: number; paymentIntent: PaymentIntent; intendedAmount?: number }) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(1);
  const [intent, setIntent] = useState<PaymentIntent>("luego");
  const [abonoAmount, setAbonoAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const maxQty = Math.min(10, product.stock);
  const total = Number(product.salePrice) * quantity;

  const abonoNum = Number(abonoAmount);
  const abonoValid = intent !== "abono" || (Number.isFinite(abonoNum) && abonoNum > 0 && abonoNum < total);

  async function handleConfirm() {
    if (intent === "abono" && !abonoValid) {
      setError(`Ingresa un monto entre Q0.01 y ${Q(total - 0.01)}`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onConfirm({
        quantity,
        paymentIntent: intent,
        intendedAmount: intent === "abono" ? abonoNum : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo apartar el producto");
      setSubmitting(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
            {/* Product header */}
            <View style={styles.productRow}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={[styles.productImage, styles.productImagePlaceholder]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productPrice}>{Q(product.salePrice)} c/u</Text>
              </View>
            </View>

            {/* Quantity */}
            <Text style={styles.sectionLabel}>Cantidad</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                disabled={quantity <= 1}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                disabled={quantity >= maxQty}
                onPress={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.stockHint}>{product.stock} disponibles</Text>
            </View>

            {/* Payment intent */}
            <Text style={styles.sectionLabel}>¿Cómo prefieres pagarlo?</Text>
            <View style={{ gap: 8 }}>
              {INTENT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.intentCard, intent === opt.key && styles.intentCardActive]}
                  activeOpacity={0.8}
                  onPress={() => setIntent(opt.key)}
                >
                  <Text style={styles.intentIcon}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.intentTitle, intent === opt.key && styles.intentTitleActive]}>{opt.title}</Text>
                    <Text style={styles.intentSubtitle}>{opt.subtitle}</Text>
                  </View>
                  <View style={[styles.radio, intent === opt.key && styles.radioActive]} />
                </TouchableOpacity>
              ))}
            </View>

            {intent === "abono" && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.sectionLabel}>¿Cuánto vas a abonar?</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder={`Ej. ${Q(Math.min(total / 2, total - 1))}`}
                  placeholderTextColor={Colors.dim}
                  value={abonoAmount}
                  onChangeText={setAbonoAmount}
                />
                <Text style={styles.helperText}>
                  Es solo un compromiso — el pago real se recibe y registra en tu sede.
                </Text>
              </View>
            )}

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{Q(total)}</Text>
            </View>

            {error !== "" && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
                onPress={handleConfirm}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.confirmBtnText}>Apartar</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 28,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: "center", marginBottom: 16,
  },
  productRow: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 18 },
  productImage: { width: 56, height: 56, borderRadius: 10 },
  productImagePlaceholder: { backgroundColor: Colors.card2 },
  productName: { color: Colors.text, fontSize: 16, fontWeight: "800" },
  productPrice: { color: Colors.gold, fontSize: 14, fontWeight: "700", marginTop: 2 },

  sectionLabel: { color: Colors.dim, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginTop: 4 },

  qtyRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.gold,
    alignItems: "center", justifyContent: "center",
  },
  qtyBtnText: { color: Colors.gold, fontSize: 20, fontWeight: "900", marginTop: -2 },
  qtyValue: { color: Colors.text, fontSize: 18, fontWeight: "800", minWidth: 24, textAlign: "center" },
  stockHint: { color: Colors.dim, fontSize: 11, marginLeft: "auto" },

  intentCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, padding: 12,
  },
  intentCardActive: { borderColor: Colors.gold, backgroundColor: Colors.gold + "12" },
  intentIcon: { fontSize: 20 },
  intentTitle: { color: Colors.text, fontSize: 13, fontWeight: "700" },
  intentTitleActive: { color: Colors.gold },
  intentSubtitle: { color: Colors.dim, fontSize: 11, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border },
  radioActive: { borderColor: Colors.gold, backgroundColor: Colors.gold },

  input: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, color: Colors.text, fontSize: 15,
  },
  helperText: { color: Colors.dim, fontSize: 11, marginTop: 6, fontStyle: "italic" },

  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  totalLabel: { color: Colors.dim, fontSize: 13, fontWeight: "700" },
  totalValue: { color: Colors.gold, fontSize: 22, fontWeight: "900" },

  errorText: { color: Colors.red, fontSize: 12, marginTop: 10 },

  buttonRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center",
  },
  cancelBtnText: { color: Colors.dim, fontWeight: "700", fontSize: 14 },
  confirmBtn: { flex: 2, backgroundColor: Colors.gold, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  confirmBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },
});
