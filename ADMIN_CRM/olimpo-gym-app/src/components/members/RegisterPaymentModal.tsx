"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, X, Check } from "lucide-react";
import { registerPayment } from "@/actions/payments";

interface Props {
  memberId: string;
  memberName: string;
  memberCode: string;
  defaultAmount: string;
  membershipEnd: string;
}

function defaultMonth(membershipEnd: string): string {
  const now = new Date();
  const end = new Date(membershipEnd + "T00:00:00");
  const base = end > now ? end : now;
  base.setDate(1);
  base.setMonth(base.getMonth() + 1);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

export function RegisterPaymentModal({ memberId, memberName, memberCode, defaultAmount, membershipEnd }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [paymentType, setPaymentType] = useState<"mensualidad" | "reposicion_carne">("mensualidad");
  const [paymentMonth, setPaymentMonth] = useState(() => defaultMonth(membershipEnd));
  const [amount, setAmount] = useState(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia">("efectivo");
  const [notes, setNotes] = useState("");

  function handleOpen() {
    setOpen(true);
    setSuccess(false);
    setError("");
    setPaymentType("mensualidad");
    setPaymentMonth(defaultMonth(membershipEnd));
    setAmount(defaultAmount);
    setPaymentMethod("efectivo");
    setNotes("");
  }

  const monthAlreadyPaid = (() => {
    if (!paymentMonth || paymentType !== "mensualidad") return false;
    const [yyyy, mm] = paymentMonth.split("-").map(Number);
    const selectedEnd = new Date(yyyy, mm, 0);
    return selectedEnd <= new Date(membershipEnd + "T00:00:00");
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (monthAlreadyPaid) return;
    setLoading(true);
    setError("");
    try {
      await registerPayment({
        memberId,
        paymentType,
        paymentMonth: paymentType === "mensualidad" ? paymentMonth : undefined,
        amount,
        paymentMethod,
        notes,
      });
      setSuccess(true);
      router.refresh();
      setTimeout(() => setOpen(false), 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrar el pago.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-olimpo-gold text-black px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
      >
        <CreditCard className="w-4 h-4" />
        Registrar Pago / Renovar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-olimpo-surface border border-olimpo-surface-light rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-olimpo-surface-light">
              <div>
                <h2 className="text-lg font-bold text-olimpo-gold">Registrar Pago</h2>
                <p className="text-sm text-olimpo-text-muted mt-0.5">
                  {memberName} · <span className="font-mono">{memberCode}</span>
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-olimpo-text-muted hover:text-olimpo-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-10 flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-olimpo-green/20 border border-olimpo-green/30 flex items-center justify-center">
                  <Check className="w-7 h-7 text-olimpo-green" />
                </div>
                <p className="text-olimpo-text font-semibold text-lg">Pago registrado</p>
                <p className="text-olimpo-text-muted text-sm">La membresía ha sido actualizada.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Payment type */}
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">
                    Tipo de pago
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["mensualidad", "reposicion_carne"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPaymentType(t)}
                        className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                          paymentType === t
                            ? "bg-olimpo-gold text-black border-olimpo-gold"
                            : "border-olimpo-surface-light text-olimpo-text-muted hover:border-olimpo-gold/50"
                        }`}
                      >
                        {t === "mensualidad" ? "Mensualidad" : "Reposición carné"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Month — only for mensualidad */}
                {paymentType === "mensualidad" && (
                  <div>
                    <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">
                      Mes a pagar
                    </label>
                    <input
                      type="month"
                      value={paymentMonth}
                      onChange={(e) => setPaymentMonth(e.target.value)}
                      required
                      className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors"
                    />
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">
                    Monto (Q)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors"
                  />
                </div>

                {/* Payment method */}
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">
                    Método de pago
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["efectivo", "transferencia"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                          paymentMethod === m
                            ? "bg-olimpo-gold text-black border-olimpo-gold"
                            : "border-olimpo-surface-light text-olimpo-text-muted hover:border-olimpo-gold/50"
                        }`}
                      >
                        {m === "efectivo" ? "Efectivo" : "Transferencia"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">
                    Notas (opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Referencia, número de boleta..."
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm placeholder:text-olimpo-text-muted/50 transition-colors"
                  />
                </div>

                {monthAlreadyPaid && (
                  <div className="text-olimpo-red text-sm bg-olimpo-red/10 border border-olimpo-red/30 rounded-lg px-3 py-2.5">
                    <p className="font-bold">Mes ya pagado</p>
                    <p className="mt-0.5 text-olimpo-red/80">
                      La membresía ya cubre este mes. Selecciona un mes posterior al{" "}
                      {new Date(membershipEnd + "T00:00:00").toLocaleDateString("es-GT", { month: "long", year: "numeric" })}.
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-olimpo-red text-sm bg-olimpo-red/10 border border-olimpo-red/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || monthAlreadyPaid}
                  className="w-full bg-olimpo-gold text-black font-bold py-3 rounded-lg hover:bg-olimpo-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base mt-1"
                >
                  {loading ? "Registrando..." : "Confirmar pago"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
