"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, X, Check, Printer, AlertTriangle, Info } from "lucide-react";
import { registerPayment } from "@/actions/payments";

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

interface Props {
  memberId: string;
  memberName: string;
  memberCode: string;
  defaultAmount: string;
  membershipEnd: string;
  paidMonths: string[]; // YYYY-MM keys already paid
  gymName: string;
  enrollmentFee?: string; // shown as warning if member has been away >9 months
}

function getNextUnpaidMonth(membershipEnd: string, paidMonths: string[]): string {
  const end = new Date(membershipEnd + "T00:00:00");
  const next = new Date(end.getFullYear(), end.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

export function RegisterPaymentModal({
  memberId,
  memberName,
  memberCode,
  defaultAmount,
  membershipEnd,
  paidMonths,
  gymName,
  enrollmentFee,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null); // past-month confirm message

  const [paymentType, setPaymentType] = useState<"mensualidad" | "reposicion_carne">("mensualidad");
  const [paymentMonth, setPaymentMonth] = useState(() => getNextUnpaidMonth(membershipEnd, paidMonths));
  const [amount, setAmount] = useState(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia">("efectivo");
  const [notes, setNotes] = useState("");
  const [lastPaymentMonth, setLastPaymentMonth] = useState<string | null>(null);

  function handleOpen() {
    setOpen(true);
    setSuccess(false);
    setError("");
    setPendingConfirm(null);
    setPaymentType("mensualidad");
    setPaymentMonth(getNextUnpaidMonth(membershipEnd, paidMonths));
    setAmount(defaultAmount);
    setPaymentMethod("efectivo");
    setNotes("");
    setLastPaymentMonth(null);
  }

  const selectedMonthKey = paymentMonth; // YYYY-MM
  const selectedIsPaid = paidMonths.includes(selectedMonthKey);

  const today = new Date();
  const [selYYYY, selMM] = paymentMonth.split("-").map(Number);
  const selectedIsPast =
    selYYYY < today.getFullYear() ||
    (selYYYY === today.getFullYear() && selMM < today.getMonth() + 1);

  // 9-month re-enrollment check
  const endDate = new Date(membershipEnd + "T00:00:00");
  const daysOverdue = today > endDate ? Math.floor((today.getTime() - endDate.getTime()) / 86400000) : 0;
  const chargeEnrollment = daysOverdue > 270 && !!enrollmentFee && enrollmentFee !== "0";

  async function submit(forceConfirm = false) {
    setLoading(true);
    setError("");
    setPendingConfirm(null);
    try {
      await registerPayment({
        memberId,
        paymentType,
        paymentMonth: paymentType === "mensualidad" ? paymentMonth : undefined,
        amount,
        paymentMethod,
        notes,
        forceConfirm,
      });
      setLastPaymentMonth(paymentType === "mensualidad" ? paymentMonth : null);
      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar el pago.";
      if (msg.startsWith("CONFIRM_PAST_MONTH:")) {
        setPendingConfirm(msg.replace("CONFIRM_PAST_MONTH:", ""));
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIsPaid) return;
    await submit(false);
  }

  function handlePrint() {
    if (!lastPaymentMonth) return;
    const [yyyy, mm] = lastPaymentMonth.split("-").map(Number);
    const endOfMonth = new Date(yyyy, mm, 0);
    const startOfMonth = new Date(yyyy, mm - 1, 1);
    const today = new Date();

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Recibo de Pago — Olimpo Gym</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#111;background:#fff;padding:24px}
  .header{text-align:center;border-bottom:3px solid #C5A55A;padding-bottom:16px;margin-bottom:20px}
  .logo-title{font-size:28px;font-weight:900;color:#C5A55A;letter-spacing:4px}
  .subtitle{font-size:12px;color:#666;margin-top:2px}
  .receipt-num{font-size:11px;color:#999;margin-top:8px}
  h2{font-size:14px;color:#C5A55A;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;border-bottom:1px solid #eee;padding-bottom:4px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:8px}
  .row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0}
  .label{color:#666;font-size:12px}
  .value{font-weight:600;font-size:12px;text-align:right}
  .total-box{background:#C5A55A;color:#000;padding:12px 20px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin:16px 0}
  .total-label{font-size:13px;font-weight:700}
  .total-value{font-size:22px;font-weight:900}
  .period-badge{display:inline-block;background:#edf7ed;color:#2e7d32;border:1px solid #a5d6a7;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:700;margin:8px 0}
  .footer{margin-top:24px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}
  .stamp{display:inline-block;border:2px solid #C5A55A;color:#C5A55A;padding:4px 16px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:2px;transform:rotate(-5deg);margin-top:12px}
  @media print{body{padding:8px}}
</style>
</head>
<body>
<div class="header">
  <div class="logo-title">OLIMPO GYM</div>
  <div class="subtitle">${gymName}</div>
  <div class="receipt-num">Recibo generado el ${today.toLocaleDateString("es-GT", {weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
</div>

<h2>Datos del Miembro</h2>
<div class="grid">
  <div class="row"><span class="label">Nombre</span><span class="value">${memberName}</span></div>
  <div class="row"><span class="label">Código</span><span class="value">${memberCode}</span></div>
</div>

<h2>Detalle del Pago</h2>
<div class="row"><span class="label">Mes pagado</span><span class="value"><span class="period-badge">${MONTHS_ES[mm - 1]} ${yyyy}</span></span></div>
<div class="row"><span class="label">Período cubierto</span><span class="value">${startOfMonth.toLocaleDateString("es-GT",{day:"numeric",month:"short",year:"numeric"})} — ${endOfMonth.toLocaleDateString("es-GT",{day:"numeric",month:"short",year:"numeric"})}</span></div>
<div class="row"><span class="label">Fecha de pago</span><span class="value">${today.toLocaleDateString("es-GT",{day:"numeric",month:"long",year:"numeric"})}</span></div>
<div class="row"><span class="label">Método</span><span class="value">${paymentMethod === "efectivo" ? "Efectivo" : "Transferencia Bancaria"}</span></div>
${notes ? `<div class="row"><span class="label">Notas</span><span class="value">${notes}</span></div>` : ""}

<div class="total-box">
  <span class="total-label">TOTAL PAGADO</span>
  <span class="total-value">Q ${parseFloat(amount).toFixed(2)}</span>
</div>

<div style="text-align:center">
  <div class="stamp">PAGADO</div>
</div>

<div class="footer">
  <p>Este recibo es un comprobante de pago de membresía en Olimpo Gym.</p>
  <p>Guárdalo como referencia. Para dudas llama a recepción.</p>
</div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=600,height=750");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
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
          <div className="bg-olimpo-surface border border-olimpo-surface-light rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-olimpo-surface-light sticky top-0 bg-olimpo-surface z-10">
              <div>
                <h2 className="text-lg font-bold text-olimpo-gold">Registrar Pago</h2>
                <p className="text-sm text-olimpo-text-muted mt-0.5">
                  {memberName} · <span className="font-mono">{memberCode}</span>
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-olimpo-text-muted hover:text-olimpo-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-olimpo-green/20 border border-olimpo-green/30 flex items-center justify-center">
                  <Check className="w-7 h-7 text-olimpo-green" />
                </div>
                <p className="text-olimpo-text font-semibold text-lg">Pago registrado</p>
                <p className="text-olimpo-text-muted text-sm">La membresía ha sido actualizada.</p>
                {lastPaymentMonth && (
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2.5 bg-olimpo-gold text-black font-bold rounded-lg hover:bg-olimpo-gold-light transition-colors mt-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir recibo
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm text-olimpo-text-muted hover:text-olimpo-text transition-colors mt-1"
                >
                  Cerrar
                </button>
              </div>
            ) : pendingConfirm ? (
              /* Past-month confirmation dialog */
              <div className="p-8 flex flex-col items-center gap-5 text-center">
                <div className="w-14 h-14 rounded-full bg-olimpo-gold/20 border border-olimpo-gold/30 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-olimpo-gold" />
                </div>
                <p className="text-olimpo-text font-semibold text-base">{pendingConfirm}</p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setPendingConfirm(null)}
                    className="flex-1 py-2.5 rounded-lg border border-olimpo-surface-light text-olimpo-text-muted hover:text-olimpo-text transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => submit(true)}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg bg-olimpo-gold text-black font-bold hover:bg-olimpo-gold-light transition-colors text-sm disabled:opacity-50"
                  >
                    {loading ? "Registrando..." : "Sí, confirmar pago"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Paid months summary */}
                {paidMonths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Meses ya pagados
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {paidMonths.map((m) => {
                        const [y, mo] = m.split("-").map(Number);
                        return (
                          <span key={m} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-olimpo-green/15 text-olimpo-green border border-olimpo-green/30">
                            {MONTHS_SHORT[mo - 1]} {y}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Re-enrollment warning (>9 months away) */}
                {chargeEnrollment && (
                  <div className="flex items-start gap-2 text-sm text-olimpo-red bg-olimpo-red/10 border border-olimpo-red/30 rounded-lg px-3 py-3">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Cobrar reinscripción</p>
                      <p className="mt-0.5 text-olimpo-red/80">
                        Este miembro lleva más de 9 meses sin pagar. Según la política del gimnasio debe pagar la inscripción nuevamente: <strong>Q {parseFloat(enrollmentFee!).toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>
                )}

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

                {/* Month selector */}
                {paymentType === "mensualidad" && (
                  <div>
                    <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">
                      Mes a pagar
                      <span className="ml-1 normal-case font-normal text-olimpo-gold">(puedes seleccionar meses pasados)</span>
                    </label>
                    <input
                      type="month"
                      value={paymentMonth}
                      onChange={(e) => setPaymentMonth(e.target.value)}
                      required
                      className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors"
                    />

                    {/* Already paid warning */}
                    {selectedIsPaid && (
                      <div className="mt-2 text-olimpo-red text-sm bg-olimpo-red/10 border border-olimpo-red/30 rounded-lg px-3 py-2.5">
                        <p className="font-bold">Mes ya pagado</p>
                        <p className="mt-0.5 text-olimpo-red/80">
                          {MONTHS_ES[(selMM - 1)]} {selYYYY} ya tiene pago registrado. Selecciona otro mes.
                        </p>
                      </div>
                    )}

                    {/* Past month notice (not paid yet) */}
                    {!selectedIsPaid && selectedIsPast && (
                      <div className="mt-2 flex items-start gap-2 text-sm text-olimpo-gold bg-olimpo-gold/10 border border-olimpo-gold/30 rounded-lg px-3 py-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          {MONTHS_ES[selMM - 1]} {selYYYY} es un mes pasado. Se te pedirá confirmación antes de guardar.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">Monto (Q)</label>
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
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">Método de pago</label>
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
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">Notas (opcional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Referencia, número de boleta..."
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm placeholder:text-olimpo-text-muted/50 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-olimpo-red text-sm bg-olimpo-red/10 border border-olimpo-red/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || selectedIsPaid}
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
