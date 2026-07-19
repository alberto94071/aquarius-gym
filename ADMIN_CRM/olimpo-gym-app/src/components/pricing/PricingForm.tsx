"use client";

import { useState, useEffect } from "react";
import { updateGymPricing } from "@/actions/pricing";
import { Save, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function PricingForm({ gyms }: { gyms: any[] }) {
  const router = useRouter();
  const [selectedGymId, setSelectedGymId] = useState(gyms[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Local state for the form
  const [prices, setPrices] = useState({
    pricingMonthly: "0",
    pricingGroupDefault: "0",
    enrollmentFee: "0",
    cardFee: "0",
    pricingDayPass: "0",
    shiftAmStart: "6",
    shiftAmEnd: "13",
    shiftPmStart: "13",
    shiftPmEnd: "21",
  });

  useEffect(() => {
    const gym = gyms.find(g => g.id === selectedGymId);
    if (gym) {
      setPrices({
        pricingMonthly: gym.pricingMonthly || "0",
        pricingGroupDefault: gym.pricingGroupDefault || "0",
        enrollmentFee: gym.enrollmentFee || "0",
        cardFee: gym.cardFee || "0",
        pricingDayPass: gym.pricingDayPass || "15",
        shiftAmStart: String(gym.shiftAmStart ?? 6),
        shiftAmEnd: String(gym.shiftAmEnd ?? 13),
        shiftPmStart: String(gym.shiftPmStart ?? 13),
        shiftPmEnd: String(gym.shiftPmEnd ?? 21),
      });
      setSuccess(false);
    }
  }, [selectedGymId, gyms]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrices({ ...prices, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("pricingMonthly", prices.pricingMonthly);
      formData.append("pricingGroupDefault", prices.pricingGroupDefault);
      formData.append("enrollmentFee", prices.enrollmentFee);
      formData.append("cardFee", prices.cardFee);
      formData.append("pricingDayPass", prices.pricingDayPass);
      formData.append("shiftAmStart", prices.shiftAmStart);
      formData.append("shiftAmEnd", prices.shiftAmEnd);
      formData.append("shiftPmStart", prices.shiftPmStart);
      formData.append("shiftPmEnd", prices.shiftPmEnd);

      await updateGymPricing(selectedGymId, formData);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar los precios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-olimpo-surface p-6 rounded-2xl border border-olimpo-surface-light shadow-lg">
      <div className="mb-6">
        <label className="block text-sm font-medium text-olimpo-text-muted mb-2">Seleccionar Sede</label>
        <div className="relative">
          <Building2 className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-olimpo-text-muted" />
          <select 
            value={selectedGymId}
            onChange={(e) => setSelectedGymId(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-olimpo-bg border border-olimpo-surface-light rounded-xl text-olimpo-text focus:outline-none focus:border-olimpo-gold transition-colors"
          >
            {gyms.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="p-4 rounded-xl border border-olimpo-surface-light bg-olimpo-bg">
            <h3 className="font-medium text-olimpo-gold mb-4">Membresía Base</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-olimpo-text-muted mb-1">Precio Mensual Individual (Q)</label>
                <input 
                  type="number" 
                  name="pricingMonthly"
                  value={prices.pricingMonthly}
                  onChange={handleChange}
                  min="0" step="0.01" required
                  className="w-full px-3 py-2 bg-olimpo-surface border border-olimpo-surface-light rounded-lg text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                />
              </div>

              <div>
                <label className="block text-sm text-olimpo-text-muted mb-1">Precio Mensual Grupal por persona (Q)</label>
                <input 
                  type="number" 
                  name="pricingGroupDefault"
                  value={prices.pricingGroupDefault}
                  onChange={handleChange}
                  min="0" step="0.01" required
                  className="w-full px-3 py-2 bg-olimpo-surface border border-olimpo-surface-light rounded-lg text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-olimpo-surface-light bg-olimpo-bg">
            <h3 className="font-medium text-olimpo-gold mb-4">Cargos Adicionales</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-olimpo-text-muted mb-1">Costo de Inscripción (Q)</label>
                <input 
                  type="number" 
                  name="enrollmentFee"
                  value={prices.enrollmentFee}
                  onChange={handleChange}
                  min="0" step="0.01" required
                  className="w-full px-3 py-2 bg-olimpo-surface border border-olimpo-surface-light rounded-lg text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                />
                <p className="text-xs text-olimpo-text-muted mt-1">Si es 0, no se cobrará inscripción.</p>
              </div>

              <div>
                <label className="block text-sm text-olimpo-text-muted mb-1">Costo de Carné (Q)</label>
                <input 
                  type="number" 
                  name="cardFee"
                  value={prices.cardFee}
                  onChange={handleChange}
                  min="0" step="0.01" required
                  className="w-full px-3 py-2 bg-olimpo-surface border border-olimpo-surface-light rounded-lg text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                />
                <p className="text-xs text-olimpo-text-muted mt-1">Si es 0, no se cobrará el carné.</p>
              </div>

              <div>
                <label className="block text-sm text-olimpo-text-muted mb-1">Pago por Día (Q)</label>
                <input
                  type="number"
                  name="pricingDayPass"
                  value={prices.pricingDayPass}
                  onChange={handleChange}
                  min="0" step="0.01" required
                  className="w-full px-3 py-2 bg-olimpo-surface border border-olimpo-surface-light rounded-lg text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                />
                <p className="text-xs text-olimpo-text-muted mt-1">Lo que paga un visitante por entrenar un solo día en esta sede.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-olimpo-surface-light bg-olimpo-bg md:col-span-2">
            <h3 className="font-medium text-olimpo-gold mb-1">Horarios de Turnos de esta Sede</h3>
            <p className="text-xs text-olimpo-text-muted mb-4">
              Definen el turno de las secretarias y la hora límite del cuadre (formato 24 h, ej. 13 = 1:00 PM).
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                ["shiftAmStart", "Mañana: inicia"],
                ["shiftAmEnd", "Mañana: termina"],
                ["shiftPmStart", "Tarde: inicia"],
                ["shiftPmEnd", "Tarde: termina"],
              ] as const).map(([name, label]) => (
                <div key={name}>
                  <label className="block text-sm text-olimpo-text-muted mb-1">{label}</label>
                  <input
                    type="number"
                    name={name}
                    value={prices[name]}
                    onChange={handleChange}
                    min="0" max="23" required
                    className="w-full px-3 py-2 bg-olimpo-surface border border-olimpo-surface-light rounded-lg text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {success && (
          <div className="bg-olimpo-green/20 border border-olimpo-green/50 text-olimpo-green p-3 rounded-lg text-sm font-medium text-center">
            ¡Precios guardados exitosamente!
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-olimpo-gold text-black px-6 py-2.5 rounded-xl font-bold hover:bg-olimpo-gold-light transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-olimpo-gold/20"
          >
            <Save className="w-5 h-5" />
            {loading ? "Guardando..." : "Guardar Precios"}
          </button>
        </div>
      </form>
    </div>
  );
}
