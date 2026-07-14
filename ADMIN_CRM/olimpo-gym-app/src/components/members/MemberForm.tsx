"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createMember } from "@/actions/members";
import { Loader2, Calculator, Copy, CheckCircle, Info } from "lucide-react";
import { PhotoUploader } from "@/components/ui/PhotoUploader";
import { addMonthsAnniversary, planMonths } from "@/lib/utils";

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/** Vence el mismo día del mes de la inscripción (aniversario) */
function calcEndDate(startStr: string, plan: string): string {
  if (!startStr) return "";
  const d = new Date(startStr + "T12:00:00");
  const end = addMonthsAnniversary(d, planMonths(plan as "mensual" | "trimestral" | "anual"));
  return end.toISOString().split("T")[0];
}

export function MemberForm({ userRole, gyms }: { userRole: string; gyms: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<{ code: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [gymId, setGymId] = useState(gyms[0]?.id || "");
  const [price, setPrice] = useState("150.00");
  const [enrollmentFee, setEnrollmentFee] = useState("0.00");
  const [cardFee, setCardFee] = useState("0.00");
  const [photoUrl, setPhotoUrl] = useState("");
  const [plan, setPlan] = useState("mensual");
  const [membershipStart, setMembershipStart] = useState(todayStr());
  const [isPastMonth, setIsPastMonth] = useState(false);

  useEffect(() => {
    const gym = gyms.find((g) => g.id === gymId);
    if (gym) {
      setPrice(gym.pricingMonthly || "150.00");
      setEnrollmentFee(gym.enrollmentFee || "0.00");
      setCardFee(gym.cardFee || "0.00");
    }
  }, [gymId, gyms]);

  useEffect(() => {
    if (!membershipStart) return;
    const today = new Date();
    const selected = new Date(membershipStart + "T12:00:00");
    // Past month = the selected month is earlier than current month
    const isP =
      selected.getFullYear() < today.getFullYear() ||
      (selected.getFullYear() === today.getFullYear() && selected.getMonth() < today.getMonth());
    setIsPastMonth(isP);
  }, [membershipStart]);

  const endDate = calcEndDate(membershipStart, plan);
  const totalToPay = Number(price) + Number(enrollmentFee) + Number(cardFee);
  const isReadOnly = userRole !== "admin";

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("enrollmentFee", enrollmentFee);
      formData.set("cardFee", cardFee);
      formData.set("membershipStart", membershipStart);
      const res = await createMember(formData);
      if (res.success) setCredentials({ code: res.code, password: res.password });
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar el miembro");
    } finally {
      setLoading(false);
    }
  }

  function copyCredentials() {
    if (!credentials) return;
    navigator.clipboard.writeText(`Código: ${credentials.code}\nContraseña: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (credentials) {
    return (
      <div className="bg-olimpo-surface rounded-2xl border border-olimpo-gold/30 p-8 max-w-md mx-auto text-center space-y-6">
        <CheckCircle className="w-14 h-14 text-olimpo-green mx-auto" />
        <div>
          <h3 className="text-xl font-serif font-bold text-olimpo-gold mb-1">¡Miembro registrado!</h3>
          <p className="text-sm text-olimpo-text-muted">Guarda estas credenciales. La contraseña no se mostrará de nuevo.</p>
        </div>
        <div className="bg-olimpo-bg rounded-xl border border-olimpo-surface-light p-5 text-left space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-olimpo-text-muted text-sm">Código</span>
            <span className="font-bold text-olimpo-gold font-mono">{credentials.code}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-olimpo-text-muted text-sm">Contraseña</span>
            <span className="font-bold text-olimpo-text font-mono text-lg">{credentials.password}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={copyCredentials}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-olimpo-gold text-olimpo-gold hover:bg-olimpo-gold/10 transition-colors text-sm font-medium"
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "¡Copiado!" : "Copiar credenciales"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/members")}
            className="flex-1 px-4 py-2 rounded-lg bg-olimpo-gold text-black font-bold hover:bg-olimpo-gold-light transition-colors text-sm"
          >
            Ir a Miembros
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-olimpo-red/10 border border-olimpo-red/30 rounded-lg text-olimpo-red text-sm">
          {error}
        </div>
      )}

      {/* Sede */}
      {userRole === "admin" && (
        <div className="bg-olimpo-surface p-6 rounded-2xl border border-olimpo-surface-light shadow-lg">
          <h3 className="text-lg font-serif font-bold text-olimpo-gold mb-4 border-b border-olimpo-surface-light pb-2">Sede</h3>
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Seleccionar Sede *</label>
            <select
              name="gymId"
              value={gymId}
              onChange={(e) => setGymId(e.target.value)}
              required
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors"
            >
              {gyms.map((gym) => (
                <option key={gym.id} value={gym.id}>{gym.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <input type="hidden" name="photoUrl" value={photoUrl} />

      {/* Fotografía */}
      <div className="bg-olimpo-surface p-6 rounded-2xl border border-olimpo-surface-light shadow-lg flex flex-col items-center">
        <h3 className="text-lg font-serif font-bold text-olimpo-gold mb-4 w-full border-b border-olimpo-surface-light pb-2 text-left">
          Fotografía del Miembro
        </h3>
        <PhotoUploader currentPhotoUrl={photoUrl} onPhotoUploaded={(url) => setPhotoUrl(url)} />
      </div>

      {/* Datos Personales */}
      <div className="bg-olimpo-surface p-6 rounded-2xl border border-olimpo-surface-light shadow-lg">
        <h3 className="text-lg font-serif font-bold text-olimpo-gold mb-4 border-b border-olimpo-surface-light pb-2">
          Datos Personales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Nombre Completo *</label>
            <input type="text" name="name" required className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Teléfono *</label>
            <input type="tel" name="phone" required className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">
              Correo electrónico <span className="text-olimpo-gold">(para acceso a la app)</span>
            </label>
            <input type="email" name="email" className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors" placeholder="ejemplo@gmail.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Fecha de Nacimiento *</label>
            <input type="date" name="birthDate" required className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Sexo *</label>
            <select name="sex" required className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors">
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Dirección (opcional)</label>
            <input
              type="text"
              name="address"
              placeholder="Colonia, municipio, ciudad..."
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors placeholder:text-olimpo-text-muted/50"
            />
          </div>
        </div>
      </div>

      {/* Contacto de Emergencia */}
      <div className="bg-olimpo-surface p-6 rounded-2xl border border-olimpo-surface-light shadow-lg">
        <h3 className="text-lg font-serif font-bold text-olimpo-gold mb-4 border-b border-olimpo-surface-light pb-2">
          Contacto de Emergencia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Nombre *</label>
            <input
              type="text"
              name="emergencyContactName"
              required
              placeholder="Nombre completo"
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Teléfono *</label>
            <input
              type="tel"
              name="emergencyContactPhone"
              required
              placeholder="Número de contacto"
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Parentesco *</label>
            <select
              name="emergencyContactRelation"
              required
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors"
            >
              <option value="">Seleccionar...</option>
              <option value="Mamá">Mamá</option>
              <option value="Papá">Papá</option>
              <option value="Esposo/a">Esposo/a</option>
              <option value="Hermano/a">Hermano/a</option>
              <option value="Hijo/a">Hijo/a</option>
              <option value="Tío/a">Tío/a</option>
              <option value="Abuelo/a">Abuelo/a</option>
              <option value="Amigo/a">Amigo/a</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Membresía y Pagos */}
      <div className="bg-olimpo-surface p-6 rounded-2xl border border-olimpo-surface-light shadow-lg">
        <h3 className="text-lg font-serif font-bold text-olimpo-gold mb-4 border-b border-olimpo-surface-light pb-2 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Membresía y Cobros
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Plan *</label>
            <select
              name="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              required
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors"
            >
              <option value="mensual">Mensual (Mes Calendario)</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">
              Mes de inicio de membresía *
              <span className="ml-1 text-olimpo-gold text-xs">(puede ser un mes pasado)</span>
            </label>
            <input
              type="month"
              value={membershipStart ? membershipStart.substring(0, 7) : ""}
              onChange={(e) => {
                // Convert YYYY-MM to YYYY-MM-01
                setMembershipStart(e.target.value ? e.target.value + "-01" : todayStr());
              }}
              required
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors"
            />
          </div>
        </div>

        {/* Past month notice */}
        {isPastMonth && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-olimpo-gold/10 border border-olimpo-gold/30 rounded-lg text-sm text-olimpo-gold">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Estás registrando un mes anterior al mes actual. La membresía quedará marcada como{" "}
              <strong>
                {membershipStart
                  ? `${MONTHS_ES[new Date(membershipStart + "T12:00:00").getMonth()]} ${new Date(membershipStart + "T12:00:00").getFullYear()} → vence ${new Date(endDate + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}`
                  : ""}
              </strong>
              . Esto es correcto si el miembro ya venía pagando antes.
            </span>
          </div>
        )}

        {/* Membership period preview */}
        {membershipStart && endDate && (
          <div className="mb-4 flex items-center gap-2 text-xs text-olimpo-text-muted bg-olimpo-surface-light/30 rounded-lg px-3 py-2">
            <span>Período:</span>
            <span className="font-semibold text-olimpo-text">
              {new Date(membershipStart + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}
              {" → "}
              {new Date(endDate + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Mensualidad (Q) *</label>
            <input
              type="number"
              step="0.01"
              name="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              readOnly={isReadOnly}
              className={`w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold ${isReadOnly ? "opacity-70 cursor-not-allowed" : ""}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Inscripción (Q)</label>
            <input
              type="number"
              step="0.01"
              value={enrollmentFee}
              onChange={(e) => setEnrollmentFee(e.target.value)}
              readOnly={isReadOnly}
              className={`w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold ${isReadOnly ? "opacity-70 cursor-not-allowed" : ""}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Carné (Q)</label>
            <input
              type="number"
              step="0.01"
              value={cardFee}
              onChange={(e) => setCardFee(e.target.value)}
              readOnly={isReadOnly}
              className={`w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold ${isReadOnly ? "opacity-70 cursor-not-allowed" : ""}`}
            />
          </div>
        </div>

        <div className="bg-olimpo-surface-light/30 p-5 rounded-xl border border-olimpo-surface-light flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="paid" value="true" defaultChecked className="w-5 h-5 rounded border-olimpo-gold text-olimpo-gold focus:ring-olimpo-gold bg-olimpo-bg" />
              <span className="text-olimpo-text font-medium">Pagó en recepción hoy</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-olimpo-text-muted">Método:</span>
              <select name="paymentMethod" className="bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-1.5 text-sm text-olimpo-text focus:outline-none focus:border-olimpo-gold">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>
          <div className="text-right bg-olimpo-gold/10 px-6 py-3 rounded-lg border border-olimpo-gold/20">
            <p className="text-xs text-olimpo-gold uppercase tracking-wider font-bold mb-1">Total a cobrar</p>
            <p className="text-2xl font-black text-olimpo-gold">Q {totalToPay.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pb-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg font-medium text-olimpo-text-muted hover:text-olimpo-text hover:bg-olimpo-surface-light transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-lg font-medium bg-olimpo-gold text-black hover:bg-olimpo-gold-light transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-olimpo-gold/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrar Miembro y Cobro"}
        </button>
      </div>
    </form>
  );
}
