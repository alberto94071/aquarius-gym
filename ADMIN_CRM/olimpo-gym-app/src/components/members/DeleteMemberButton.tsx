"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteMember } from "@/actions/members";

export function DeleteMemberButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      await deleteMember(memberId);
      // redirect happens inside the action
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-olimpo-red/40 text-olimpo-red hover:bg-olimpo-red/10 transition-colors text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" /> Eliminar miembro
      </button>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-olimpo-surface border border-olimpo-red/40 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-olimpo-red/15 border border-olimpo-red/30 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-olimpo-red" />
              </div>
              <h2 className="text-lg font-bold text-olimpo-text">¿Eliminar miembro?</h2>
              <p className="text-sm text-olimpo-text-muted">
                Estás a punto de eliminar a <span className="font-semibold text-olimpo-text">{memberName}</span>.
                Sus pagos se conservarán en el historial financiero pero el perfil desaparecerá permanentemente.
              </p>
              <p className="text-xs text-olimpo-red font-semibold uppercase tracking-wide">Esta acción no se puede deshacer.</p>
            </div>

            {error && (
              <p className="text-olimpo-red text-sm bg-olimpo-red/10 border border-olimpo-red/20 rounded-lg px-3 py-2 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setConfirm(false); setError(""); }}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg border border-olimpo-surface-light text-olimpo-text-muted hover:text-olimpo-text transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-olimpo-red text-white font-bold hover:bg-red-600 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</> : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
