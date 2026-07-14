"use client";

import { useState } from "react";
import { createSystemUser } from "@/actions/users";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserFormModal({ gyms, onClose }: { gyms: any[], onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [roleSelection, setRoleSelection] = useState("admin");
  const [gymId, setGymId] = useState(gyms[0]?.id || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const dbRole = roleSelection === "secretaria" ? "secretaria" : "admin";

      const res = await createSystemUser({
        email,
        name,
        role: dbRole,
        gymId: roleSelection === "admin" ? undefined : gymId
      });

      if (res.success) {
        router.refresh();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-olimpo-surface border border-olimpo-surface-light p-6 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-olimpo-gold font-serif">Nuevo Usuario</h2>
          <button onClick={onClose} className="text-olimpo-text-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-olimpo-red/10 border border-olimpo-red/30 rounded-lg text-olimpo-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-olimpo-text-muted mb-1">Nombre Completo</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2 text-olimpo-text focus:border-olimpo-gold focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm text-olimpo-text-muted mb-1">Correo (Gmail)</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2 text-olimpo-text focus:border-olimpo-gold focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm text-olimpo-text-muted mb-1">Rol</label>
            <select value={roleSelection} onChange={e => setRoleSelection(e.target.value)} className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2 text-olimpo-text focus:border-olimpo-gold focus:outline-none">
              <option value="admin">Administrador (Acceso total)</option>
              <option value="secretaria">Secretaria</option>
            </select>
          </div>

          {roleSelection === "secretaria" && (
            <div>
              <label className="block text-sm text-olimpo-text-muted mb-1">Sede Asignada</label>
              <select value={gymId} onChange={e => setGymId(e.target.value)} className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2 text-olimpo-text focus:border-olimpo-gold focus:outline-none">
                {gyms.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-olimpo-text-muted hover:bg-olimpo-surface-light transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-olimpo-gold text-black font-medium hover:bg-olimpo-gold-light transition-colors flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
