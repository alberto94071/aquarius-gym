"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check, Loader2 } from "lucide-react";
import { updateMember } from "@/actions/members";

interface Props {
  member: {
    id: string;
    name: string;
    phone: string;
    email: string;
    birthDate: string;
    sex: "M" | "F";
    plan: "mensual" | "trimestral" | "anual";
    price: string;
    membershipStart: string;
    membershipEnd: string;
    address?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    emergencyContactRelation?: string | null;
    notes?: string | null;
  };
  userRole: string;
}

const PARENTESCO_OPTIONS = ["Mamá", "Papá", "Esposo/a", "Hermano/a", "Hijo/a", "Tío/a", "Amigo/a", "Otro"];

export function EditMemberModal({ member, userRole }: Props) {
  const isAdmin = userRole === "admin";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData(e.currentTarget);
      await updateMember(member.id, fd);
      setSuccess(true);
      router.refresh();
      setTimeout(() => { setOpen(false); setSuccess(false); }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar cambios.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSuccess(false); setError(""); }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-olimpo-surface-light text-olimpo-text-muted hover:text-olimpo-gold hover:border-olimpo-gold/50 transition-colors text-sm font-medium"
      >
        <Pencil className="w-4 h-4" /> Editar datos
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-olimpo-surface border border-olimpo-surface-light rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-olimpo-surface-light sticky top-0 bg-olimpo-surface z-10">
              <h2 className="text-lg font-bold text-olimpo-gold flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Editar Miembro
              </h2>
              <button onClick={() => setOpen(false)} className="text-olimpo-text-muted hover:text-olimpo-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-10 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-olimpo-green/20 border border-olimpo-green/30 flex items-center justify-center">
                  <Check className="w-7 h-7 text-olimpo-green" />
                </div>
                <p className="text-olimpo-text font-semibold">Datos actualizados</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Datos personales */}
                <div>
                  <h3 className="text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-3">Datos personales</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-olimpo-text-muted mb-1">Nombre completo *</label>
                      <input name="name" required defaultValue={member.name}
                        className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-olimpo-text-muted mb-1">Teléfono *</label>
                      <input name="phone" required defaultValue={member.phone}
                        className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-olimpo-text-muted mb-1">Correo</label>
                      <input name="email" type="email" defaultValue={member.email === "sin_correo@olimpo.com" ? "" : member.email}
                        className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-olimpo-text-muted mb-1">Fecha de nacimiento *</label>
                      <input name="birthDate" type="date" required defaultValue={member.birthDate}
                        className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-olimpo-text-muted mb-1">Sexo *</label>
                      <select name="sex" required defaultValue={member.sex}
                        className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors">
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-olimpo-text-muted mb-1">Dirección</label>
                      <input name="address" defaultValue={member.address ?? ""}
                        className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Membresía — solo admin */}
                {isAdmin ? (
                  <div>
                    <h3 className="text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-3">Membresía</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-olimpo-text-muted mb-1">Plan *</label>
                        <select name="plan" required defaultValue={member.plan}
                          className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors">
                          <option value="mensual">Mensual</option>
                          <option value="trimestral">Trimestral</option>
                          <option value="anual">Anual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-olimpo-text-muted mb-1">Tarifa (Q) *</label>
                        <input name="price" type="number" step="0.01" min="0" required defaultValue={member.price}
                          className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-olimpo-text-muted mb-1">Inicio membresía *</label>
                        <input name="membershipStart" type="date" required defaultValue={member.membershipStart}
                          className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-olimpo-text-muted mb-1">Vencimiento *</label>
                        <input name="membershipEnd" type="date" required defaultValue={member.membershipEnd}
                          className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Hidden inputs so server action receives the unchanged values */
                  <>
                    <input type="hidden" name="plan" value={member.plan} />
                    <input type="hidden" name="price" value={member.price} />
                    <input type="hidden" name="membershipStart" value={member.membershipStart} />
                    <input type="hidden" name="membershipEnd" value={member.membershipEnd} />
                  </>
                )}

                {/* Contacto de emergencia */}
                <div>
                  <h3 className="text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-3">Contacto de emergencia</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-olimpo-text-muted mb-1">Nombre</label>
                      <input name="emergencyContactName" defaultValue={member.emergencyContactName ?? ""}
                        className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-olimpo-text-muted mb-1">Teléfono</label>
                      <input name="emergencyContactPhone" defaultValue={member.emergencyContactPhone ?? ""}
                        className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-olimpo-text-muted mb-1">Parentesco</label>
                      <select name="emergencyContactRelation" defaultValue={member.emergencyContactRelation ?? ""}
                        className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors">
                        <option value="">Seleccionar...</option>
                        {PARENTESCO_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-xs text-olimpo-text-muted mb-1">Notas internas</label>
                  <textarea name="notes" rows={2} defaultValue={member.notes ?? ""}
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors resize-none" />
                </div>

                {error && (
                  <p className="text-olimpo-red text-sm bg-olimpo-red/10 border border-olimpo-red/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-olimpo-surface-light text-olimpo-text-muted hover:text-olimpo-text transition-colors text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 rounded-lg bg-olimpo-gold text-black font-bold hover:bg-olimpo-gold-light transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Guardar cambios"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
