"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, CreditCard, Calendar, User, ShieldCheck, Users, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { searchMembersForPayment, getMoraMembers, registerPayment, getGroupDetailsForPayment, getMemberPaymentInfo } from "@/actions/payments";

// ── helpers ─────────────────────────────────────────────────────────────────

const MONTHS_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function periodToMonthLabel(periodStart: string | null, periodEnd: string | null): string {
  if (!periodStart || !periodEnd) return "—";
  const d1 = new Date(periodStart + "T00:00:00");
  d1.setDate(d1.getDate() + 1); // day after periodStart = first day of new period
  const d2 = new Date(periodEnd + "T00:00:00");
  if (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()) {
    return `${MONTHS_FULL[d1.getMonth()]} ${d1.getFullYear()}`;
  }
  if (d1.getFullYear() === d2.getFullYear()) {
    return `${MONTHS_SHORT[d1.getMonth()]} – ${MONTHS_SHORT[d2.getMonth()]} ${d2.getFullYear()}`;
  }
  return `${MONTHS_SHORT[d1.getMonth()]} ${d1.getFullYear()} – ${MONTHS_SHORT[d2.getMonth()]} ${d2.getFullYear()}`;
}

function nextMonthLabel(yyyyMM: string): string {
  const [yyyy, mm] = yyyyMM.split("-").map(Number);
  return `${MONTHS_FULL[mm - 1]} ${yyyy}`;
}

function formatEndDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
}

// ── component ────────────────────────────────────────────────────────────────

export function PaymentsDashboard({ userRole, gyms }: { userRole: string; gyms: any[] }) {
  const [query, setQuery] = useState("");
  const [gymFilter, setGymFilter] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [memberPaymentInfo, setMemberPaymentInfo] = useState<any | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const [paymentType, setPaymentType] = useState<"mensualidad" | "reposicion_carne">("mensualidad");
  const [amount, setAmount] = useState("");
  const [paymentMonth, setPaymentMonth] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia">("efectivo");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);

  // Load mora members by default; search when query is typed
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = query.trim()
          ? await searchMembersForPayment(query, gymFilter || undefined)
          : await getMoraMembers(gymFilter || undefined);
        setResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSearch(false);
      }
    }, query.trim() ? 500 : 0);
    return () => clearTimeout(timer);
  }, [query, gymFilter]);

  // Update default amount when type or group changes
  useEffect(() => {
    if (!selectedMember) return;
    if (paymentType === "reposicion_carne") {
      setAmount("15.00");
    } else if (selectedGroup) {
      setAmount(selectedGroup.totalAmount);
    } else {
      setAmount(selectedMember.price);
    }
  }, [paymentType, selectedMember, selectedGroup]);

  const handleSelectMember = async (m: any) => {
    setSuccessMsg("");
    setErrorMsg("");
    setPendingConfirm(null);
    setSelectedMember(m);
    setSelectedGroup(null);
    setMemberPaymentInfo(null);
    setPaymentType("mensualidad");
    setAmount(m.price);

    // Fetch payment info + group in parallel
    setLoadingInfo(true);
    const promises: Promise<any>[] = [getMemberPaymentInfo(m.id)];
    if (m.groupId) {
      setLoadingGroup(true);
      promises.push(getGroupDetailsForPayment(m.groupId));
    }

    try {
      const [info, groupDetails] = await Promise.all(promises);
      setMemberPaymentInfo(info);
      setPaymentMonth(info.nextMonthToPay);

      if (groupDetails) {
        setSelectedGroup(groupDetails);
        setAmount(groupDetails.totalAmount);
      }

      // If >6 months away and has enrollment fee, add it to the amount
      if (info.chargeEnrollment && parseFloat(info.enrollmentFee) > 0) {
        const base = groupDetails ? parseFloat(groupDetails.totalAmount) : parseFloat(m.price);
        setAmount((base + parseFloat(info.enrollmentFee)).toFixed(2));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInfo(false);
      setLoadingGroup(false);
    }
  };

  // Check if the selected month is already covered by the membership
  const monthAlreadyPaid = (() => {
    if (!memberPaymentInfo || !paymentMonth || paymentType !== "mensualidad") return false;
    const [yyyy, mm] = paymentMonth.split("-").map(Number);
    const selectedEnd = new Date(yyyy, mm, 0); // last day of selected month
    const memberEnd = new Date(memberPaymentInfo.membershipEnd + "T00:00:00");
    return selectedEnd <= memberEnd;
  })();

  const submit = async (forceConfirm = false) => {
    setProcessing(true);
    setErrorMsg("");
    setPendingConfirm(null);
    try {
      await registerPayment({
        memberId: selectedGroup
          ? selectedGroup.groupMembers.find((gm: any) => gm.isRepresentative)?.id || selectedMember.id
          : selectedMember.id,
        paymentType,
        paymentMonth,
        amount,
        paymentMethod,
        notes,
        forceConfirm,
      });
      setSuccessMsg(`Pago de Q${amount} registrado exitosamente.`);
      setSelectedMember(null);
      setSelectedGroup(null);
      setMemberPaymentInfo(null);
      // Refresh list — morosos if no query, search otherwise
      const res = query.trim()
        ? await searchMembersForPayment(query, gymFilter || undefined)
        : await getMoraMembers(gymFilter || undefined);
      setResults(res);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error al registrar el pago.";
      if (msg.startsWith("CONFIRM_PAST_MONTH:")) {
        setPendingConfirm(msg.replace("CONFIRM_PAST_MONTH:", ""));
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMember || monthAlreadyPaid) return;
    await submit(false);
  };

  // mora si hoy > día 8 del mes siguiente al vencimiento
  const isMora = (endDateStr: string) => {
    const end = new Date(endDateStr + "T00:00:00");
    const graceDeadline = new Date(end.getFullYear(), end.getMonth() + 1, 8);
    return new Date() > graceDeadline;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* ── Left: Search ── */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-olimpo-surface p-4 rounded-2xl border border-olimpo-surface-light shadow-lg space-y-3">
          {userRole === "admin" && (
            <select
              value={gymFilter}
              onChange={(e) => setGymFilter(e.target.value)}
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-xl px-4 py-2 text-sm text-olimpo-text focus:outline-none focus:border-olimpo-gold"
            >
              <option value="">Todas las Sedes</option>
              {gyms.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olimpo-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-xl pl-10 pr-4 py-3 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors"
            />
            {loadingSearch && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olimpo-gold animate-spin" />}
          </div>
        </div>

        <div className="bg-olimpo-surface rounded-2xl border border-olimpo-surface-light shadow-lg overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-olimpo-surface-light bg-olimpo-surface-light/20">
            <h3 className="font-medium text-olimpo-gold">
              {query.trim() ? `Resultados (${results.length})` : `En mora (${results.length})`}
            </h3>
            {!query.trim() && results.length > 0 && (
              <p className="text-xs text-olimpo-text-muted mt-0.5">Busca por nombre o código para ver otros miembros</p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="text-center text-olimpo-text-muted mt-10">{query.trim() ? "Sin resultados." : "No hay miembros en mora. ✓"}</p>
            ) : (
              <div className="space-y-2">
                {results.map((m) => {
                  const mora = isMora(m.membershipEnd);
                  const end = new Date(m.membershipEnd + "T00:00:00");
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMember(m)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedMember?.id === m.id
                          ? "bg-olimpo-gold/10 border-olimpo-gold/50 shadow-sm"
                          : "bg-olimpo-bg border-olimpo-surface-light hover:border-olimpo-gold/30 hover:bg-olimpo-surface-light/30"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-olimpo-text flex items-center gap-2">
                            {m.name}
                            {m.groupId && <Users className="w-3.5 h-3.5 text-olimpo-text-muted" />}
                          </p>
                          <p className="text-xs text-olimpo-gold font-mono">{m.code}</p>
                          <p className="text-xs text-olimpo-text-muted mt-0.5">
                            Hasta: {MONTHS_SHORT[end.getMonth()]} {end.getFullYear()}
                          </p>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                          mora ? "bg-olimpo-red text-white" : "bg-green-500/10 text-green-500"
                        }`}>
                          {mora ? "MOROSO" : "AL DÍA"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Payment form ── */}
      <div className="lg:col-span-7">
        {successMsg && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 text-green-500 rounded-xl font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {successMsg}
          </div>
        )}

        {selectedMember ? (
          <div className="bg-olimpo-surface p-6 sm:p-8 rounded-2xl border border-olimpo-surface-light shadow-lg relative">
            {(loadingGroup || loadingInfo) && (
              <div className="absolute inset-0 bg-olimpo-surface/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl">
                <Loader2 className="w-10 h-10 text-olimpo-gold animate-spin mb-4" />
                <p className="text-olimpo-gold font-medium animate-pulse">Cargando información...</p>
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-2xl font-serif font-bold text-olimpo-gold mb-1">Registrar Cobro</h2>
                <p className="text-olimpo-text-muted">
                  {selectedGroup ? "Pago Grupal | " : ""}
                  Para: <span className="font-medium text-olimpo-text">{selectedMember.name}</span>
                </p>
              </div>
              <span className={`text-xs uppercase font-black px-3 py-1.5 rounded-lg ${
                isMora(selectedMember.membershipEnd)
                  ? "bg-olimpo-red text-white shadow-[0_0_15px_rgba(255,0,0,0.4)]"
                  : "bg-green-500/20 text-green-400 border border-green-500/50"
              }`}>
                {isMora(selectedMember.membershipEnd) ? "MOROSO" : "AL DÍA"}
              </span>
            </div>

            {/* ── Membership status panel ── */}
            {memberPaymentInfo && (
              <div className="mb-6 rounded-xl border border-olimpo-surface-light overflow-hidden">
                {/* Enrollment fee warning */}
                {memberPaymentInfo.chargeEnrollment && parseFloat(memberPaymentInfo.enrollmentFee) > 0 && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-olimpo-orange/10 border-b border-olimpo-orange/30">
                    <AlertTriangle className="w-4 h-4 text-olimpo-orange shrink-0 mt-0.5" />
                    <p className="text-sm text-olimpo-orange">
                      Han pasado más de 6 meses desde que venció la membresía.
                      Se ha agregado la inscripción de <strong>Q{parseFloat(memberPaymentInfo.enrollmentFee).toFixed(2)}</strong> al monto.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 divide-x divide-olimpo-surface-light bg-olimpo-bg/50">
                  <div className="px-4 py-3">
                    <p className="text-xs text-olimpo-text-muted uppercase tracking-wider mb-1">Pagado hasta</p>
                    <p className="text-sm font-semibold text-olimpo-text">{formatEndDate(memberPaymentInfo.membershipEnd)}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-olimpo-text-muted uppercase tracking-wider mb-1">Próximo mes a pagar</p>
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-olimpo-gold" />
                      <p className="text-sm font-bold text-olimpo-gold">{nextMonthLabel(memberPaymentInfo.nextMonthToPay)}</p>
                    </div>
                  </div>
                </div>

                {/* Recent payments */}
                {memberPaymentInfo.recentPayments.filter((p: any) => p.periodEnd).length > 0 && (
                  <div className="px-4 py-3 border-t border-olimpo-surface-light">
                    <p className="text-xs text-olimpo-text-muted uppercase tracking-wider mb-2">Últimos meses pagados</p>
                    <div className="flex flex-wrap gap-2">
                      {memberPaymentInfo.recentPayments
                        .filter((p: any) => p.periodEnd)
                        .slice(0, 4)
                        .map((p: any) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {periodToMonthLabel(p.periodStart, p.periodEnd)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Group summary */}
            {selectedGroup && paymentType === "mensualidad" && (
              <div className="bg-olimpo-gold/5 border border-olimpo-gold/30 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-olimpo-gold" />
                  <h4 className="font-bold text-olimpo-gold">Grupo ({selectedGroup.groupMembers.length} integrantes)</h4>
                </div>
                <div className="space-y-2 mb-3">
                  {selectedGroup.groupMembers.map((gm: any) => (
                    <div key={gm.id} className="flex justify-between items-center text-sm p-2 bg-olimpo-bg rounded-lg border border-olimpo-surface-light">
                      <span className="flex items-center gap-2 text-olimpo-text">
                        {gm.isRepresentative && <ShieldCheck className="w-4 h-4 text-olimpo-gold" />}
                        {gm.name}
                      </span>
                      <span className="text-olimpo-text-muted font-mono">Q {gm.price}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-olimpo-text-muted">Al confirmar, se renueva la membresía de todos los integrantes.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-olimpo-text-muted mb-2">Tipo de Cobro</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPaymentType("mensualidad")}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                        paymentType === "mensualidad" ? "bg-olimpo-gold text-black shadow-md" : "bg-olimpo-bg text-olimpo-text-muted hover:text-olimpo-text border border-olimpo-surface-light"
                      }`}>
                      <Calendar className="w-4 h-4" /> Mensualidad
                    </button>
                    <button type="button" onClick={() => setPaymentType("reposicion_carne")}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                        paymentType === "reposicion_carne" ? "bg-olimpo-gold text-black shadow-md" : "bg-olimpo-bg text-olimpo-text-muted hover:text-olimpo-text border border-olimpo-surface-light"
                      }`}>
                      <User className="w-4 h-4" /> Reposición Carné
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-olimpo-text-muted mb-2">Método de Pago</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPaymentMethod("efectivo")}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                        paymentMethod === "efectivo" ? "bg-olimpo-surface-light text-olimpo-text border border-olimpo-gold/30" : "bg-olimpo-bg text-olimpo-text-muted border border-olimpo-surface-light"
                      }`}>
                      💵 Efectivo
                    </button>
                    <button type="button" onClick={() => setPaymentMethod("transferencia")}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                        paymentMethod === "transferencia" ? "bg-olimpo-surface-light text-olimpo-text border border-olimpo-gold/30" : "bg-olimpo-bg text-olimpo-text-muted border border-olimpo-surface-light"
                      }`}>
                      🏦 Transf.
                    </button>
                  </div>
                </div>
              </div>

              {paymentType === "mensualidad" && (
                <div>
                  <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Mes que está pagando</label>
                  <input
                    type="month"
                    required
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-xl px-4 py-3 text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                  />
                  <p className="text-xs text-olimpo-text-muted mt-1">
                    La membresía se extenderá hasta el último día del mes seleccionado.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Monto a Cobrar (Q)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-olimpo-text-muted font-bold">Q</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    readOnly={userRole !== "admin"}
                    className={`w-full bg-olimpo-bg border border-olimpo-surface-light rounded-xl pl-10 pr-4 py-3 text-xl font-bold text-olimpo-text focus:outline-none focus:border-olimpo-gold ${userRole !== "admin" ? "opacity-80" : ""}`}
                  />
                </div>
                {userRole !== "admin" && (
                  <p className="text-xs text-olimpo-text-muted mt-1">Solo el administrador puede modificar el monto.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Notas (Opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Pagó en moneda de a 1, o transfirió ayer..."
                  className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-xl px-4 py-3 text-sm text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                />
              </div>

              {/* Month already paid warning */}
              {monthAlreadyPaid && memberPaymentInfo && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-olimpo-red/10 border border-olimpo-red/40">
                  <AlertTriangle className="w-5 h-5 text-olimpo-red shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-olimpo-red">Mes ya pagado — no se puede registrar</p>
                    <p className="text-sm text-olimpo-red/80 mt-0.5">
                      La membresía ya cubre hasta{" "}
                      <strong>{formatEndDate(memberPaymentInfo.membershipEnd)}</strong>.{" "}
                      El próximo mes a cobrar es{" "}
                      <strong>{nextMonthLabel(memberPaymentInfo.nextMonthToPay)}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Past month confirmation warning box */}
              {pendingConfirm && (
                <div className="p-4 rounded-xl bg-olimpo-gold/15 border border-olimpo-gold/40 space-y-3 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-olimpo-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-olimpo-gold">Confirmación de Pago Pasado</p>
                      <p className="text-sm text-olimpo-text/90 mt-0.5">{pendingConfirm}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPendingConfirm(null)}
                      className="flex-1 py-2 px-4 rounded-lg bg-olimpo-bg border border-olimpo-surface-light text-olimpo-text-muted hover:text-olimpo-text transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => submit(true)}
                      disabled={processing}
                      className="flex-1 py-2 px-4 rounded-lg bg-olimpo-gold text-black hover:bg-olimpo-gold-light transition-colors text-sm font-bold disabled:opacity-50"
                    >
                      {processing ? "Procesando..." : "Sí, confirmar pago pasado"}
                    </button>
                  </div>
                </div>
              )}

              {/* Server error */}
              {errorMsg && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-olimpo-red/10 border border-olimpo-red/40 mb-4">
                  <AlertTriangle className="w-5 h-5 text-olimpo-red shrink-0 mt-0.5" />
                  <p className="text-sm text-olimpo-red">{errorMsg}</p>
                </div>
              )}

              <div className="pt-4 border-t border-olimpo-surface-light">
                {!pendingConfirm ? (
                  <button
                    type="submit"
                    disabled={processing || monthAlreadyPaid}
                    className="w-full py-4 rounded-xl font-bold text-lg bg-olimpo-gold text-black hover:bg-olimpo-gold-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-olimpo-gold/20"
                  >
                    {processing
                      ? <Loader2 className="w-6 h-6 animate-spin" />
                      : (selectedGroup && paymentType === "mensualidad" ? "Pagar para todos los del Grupo" : "Confirmar e Imprimir Recibo")}
                  </button>
                ) : (
                  <p className="text-xs text-olimpo-text-muted text-center py-2">
                    Por favor confirma o cancela la advertencia de mes pasado de arriba para continuar.
                  </p>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-olimpo-surface border border-olimpo-surface-light rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center text-olimpo-text-muted p-6 text-center">
            <CreditCard className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-serif text-olimpo-text mb-2">Ningún Miembro Seleccionado</h3>
            <p className="max-w-md">Usa el buscador de la izquierda para encontrar a un miembro y registrar su mensualidad o reposición de carné.</p>
          </div>
        )}
      </div>
    </div>
  );
}
