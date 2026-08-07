"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/actions/groups";
import { Loader2, Plus, Trash2, ShieldCheck, User, Calculator } from "lucide-react";

export function GroupForm({ userRole, gyms }: { userRole: string, gyms: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [gymId, setGymId] = useState(gyms[0]?.id || "");
  const [pricePerPerson, setPricePerPerson] = useState("100.00");
  const [enrollmentFee, setEnrollmentFee] = useState("0.00");
  const [cardFee, setCardFee] = useState("0.00");
  const [paidFull, setPaidFull] = useState(true);
  const [plan, setPlan] = useState<"semanal" | "quincenal" | "mensual" | "trimestral">("mensual");
  const [accessLevel, setAccessLevel] = useState<"basico" | "vip">("vip");

  // Initial state: 1 Representative + 1 extra member
  const [members, setMembers] = useState([
    { id: 1, name: "", phone: "", birthDate: "", sex: "M", isRep: true },
    { id: 2, name: "", phone: "", birthDate: "", sex: "M", isRep: false }
  ]);

  // Set default fees based on gym selection
  useEffect(() => {
    const gym = gyms.find(g => g.id === gymId);
    if (gym) {
      setPricePerPerson(gym.pricingGroupDefault || "100.00");
      setEnrollmentFee(gym.enrollmentFee || "0.00");
      setCardFee(gym.cardFee || "0.00");
    }
  }, [gymId, gyms]);

  // El plan trimestral ("Súper PROMO") solo existe en VIP
  useEffect(() => {
    if (plan === "trimestral" && accessLevel !== "vip") setAccessLevel("vip");
  }, [plan]);

  const isReadOnly = userRole !== "admin";
  const perPersonTotal = Number(pricePerPerson) + Number(enrollmentFee) + Number(cardFee);
  const grandTotal = perPersonTotal * members.length;

  const addMember = () => {
    setMembers([...members, { id: Date.now(), name: "", phone: "", birthDate: "", sex: "M", isRep: false }]);
  };

  const removeMember = (id: number) => {
    if (members.length <= 2) return; // Enforce minimum 2 members
    setMembers(members.filter(m => m.id !== id));
  };

  const updateMember = (id: number, field: string, value: string) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const emptyNames = members.some(m => m.name.trim() === "");
    if (emptyNames) {
      setError("Todos los integrantes deben tener un nombre.");
      setLoading(false);
      return;
    }

    try {
      const groupData = {
        pricePerPerson,
        enrollmentFee,
        cardFee,
        paidFull,
        plan,
        accessLevel,
        notes: ""
      };
      const res = await createGroup(gymId, groupData, members);
      if (res.success) {
        router.push("/groups");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar el grupo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-olimpo-red/10 border border-olimpo-red/30 rounded-lg text-olimpo-red text-sm">
          {error}
        </div>
      )}

      {/* Sede & Payment Settings */}
      <div className="bg-olimpo-surface p-6 rounded-2xl border border-olimpo-surface-light shadow-lg">
        <h3 className="text-lg font-serif font-bold text-olimpo-gold mb-4 border-b border-olimpo-surface-light pb-2 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Configuración y Cobros del Grupo
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {userRole === "admin" && (
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Sede *</label>
              <select value={gymId} onChange={(e) => setGymId(e.target.value)} required className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold">
                {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Plan *</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)} required className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold">
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual (ej. PROMO 2 VIP)</option>
              <option value="trimestral">Trimestral (solo VIP)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Nivel de acceso *</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as "basico" | "vip")}
              required
              disabled={plan === "trimestral"}
              className={`w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold ${plan === "trimestral" ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <option value="basico">Básico</option>
              <option value="vip">VIP (área 4to. nivel)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Mensualidad x Persona (Q) *</label>
            <input type="number" step="0.01" value={pricePerPerson} onChange={(e) => setPricePerPerson(e.target.value)} readOnly={isReadOnly} required className={`w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`} />
          </div>

          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Inscripción x Persona (Q) *</label>
            <input type="number" step="0.01" value={enrollmentFee} onChange={(e) => setEnrollmentFee(e.target.value)} readOnly={isReadOnly} required className={`w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`} />
          </div>

          <div>
            <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Carné x Persona (Q) *</label>
            <input type="number" step="0.01" value={cardFee} onChange={(e) => setCardFee(e.target.value)} readOnly={isReadOnly} required className={`w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-4 py-2 text-olimpo-text focus:outline-none focus:border-olimpo-gold ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`} />
          </div>
        </div>

        <div className="bg-olimpo-surface-light/30 p-5 rounded-xl border border-olimpo-surface-light flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={paidFull} onChange={(e) => setPaidFull(e.target.checked)} className="w-5 h-5 rounded border-olimpo-gold text-olimpo-gold focus:ring-olimpo-gold bg-olimpo-bg" />
              <span className="text-olimpo-text font-medium">¿El grupo pagó hoy en recepción?</span>
            </label>
          </div>

          <div className="text-right bg-olimpo-gold/10 px-6 py-3 rounded-lg border border-olimpo-gold/20">
            <p className="text-xs text-olimpo-gold uppercase tracking-wider font-bold mb-1">Total a cobrar al grupo</p>
            <p className="text-2xl font-black text-olimpo-gold">Q {grandTotal.toFixed(2)}</p>
            <p className="text-[10px] text-olimpo-gold/80 mt-1">
              (Q {perPersonTotal.toFixed(2)} por {members.length} personas)
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Members Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-serif font-bold text-olimpo-gold border-b border-olimpo-surface-light pb-2 flex items-center justify-between">
          <span>Integrantes del Grupo ({members.length})</span>
        </h3>

        {members.map((m, index) => (
          <div key={m.id} className={`p-5 rounded-xl border relative transition-all ${
            m.isRep ? "bg-olimpo-gold/5 border-olimpo-gold/30 shadow-[0_0_15px_rgba(197,165,90,0.05)]" : "bg-olimpo-surface border-olimpo-surface-light"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {m.isRep ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-olimpo-gold bg-olimpo-gold/10 px-2 py-1 rounded uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" /> Representante (Responsable)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-olimpo-text-muted bg-olimpo-surface-light px-2 py-1 rounded uppercase tracking-wider">
                    <User className="w-4 h-4" /> Integrante #{index + 1}
                  </span>
                )}
              </div>
              
              {!m.isRep && members.length > 2 && (
                <button 
                  type="button" 
                  onClick={() => removeMember(m.id)}
                  className="p-1.5 text-olimpo-text-muted hover:text-olimpo-red hover:bg-olimpo-red/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-olimpo-text-muted mb-1">Nombre Completo *</label>
                <input type="text" required value={m.name} onChange={(e) => updateMember(m.id, 'name', e.target.value)} className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2 text-sm text-olimpo-text focus:outline-none focus:border-olimpo-gold" />
              </div>
              <div>
                <label className="block text-xs font-medium text-olimpo-text-muted mb-1">Teléfono {m.isRep && '*'}</label>
                <input type="tel" required={m.isRep} value={m.phone} onChange={(e) => updateMember(m.id, 'phone', e.target.value)} className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2 text-sm text-olimpo-text focus:outline-none focus:border-olimpo-gold" />
              </div>
              <div>
                <label className="block text-xs font-medium text-olimpo-text-muted mb-1">F. Nacimiento *</label>
                <input type="date" required value={m.birthDate} onChange={(e) => updateMember(m.id, 'birthDate', e.target.value)} className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2 text-sm text-olimpo-text focus:outline-none focus:border-olimpo-gold" />
              </div>
            </div>
          </div>
        ))}

        <button 
          type="button" 
          onClick={addMember}
          className="w-full py-4 border-2 border-dashed border-olimpo-surface-light rounded-xl text-olimpo-text-muted hover:text-olimpo-gold hover:border-olimpo-gold/50 hover:bg-olimpo-gold/5 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Añadir otro integrante
        </button>
      </div>

      <div className="flex justify-end gap-4 pb-10 pt-4 border-t border-olimpo-surface-light">
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
          className="px-6 py-2 rounded-lg font-medium bg-olimpo-gold text-black hover:bg-olimpo-gold-light transition-colors flex items-center gap-2 shadow-lg shadow-olimpo-gold/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Grupo Completo"}
        </button>
      </div>
    </form>
  );
}
