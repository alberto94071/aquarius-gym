"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, X, Check, Loader2, Paperclip } from "lucide-react";
import { pauseMembership } from "@/actions/members";

interface Props {
  memberId: string;
  currentEnd: string;
}

export function PauseMembershipModal({ memberId, currentEnd }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "olimpo_members";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) setProofUrl(data.secure_url);
      else throw new Error(data.error?.message || "Error al subir el comprobante");
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo subir el comprobante");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await pauseMembership({
        memberId,
        days: Number(days),
        reason,
        proofUrl: proofUrl || undefined,
      });
      setSuccess(res.newEnd);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la pausa");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setOpen(false);
    setSuccess(null);
    setDays("7");
    setReason("");
    setProofUrl("");
    setError("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-olimpo-surface-light text-olimpo-text-muted hover:text-olimpo-gold hover:border-olimpo-gold/50 transition-colors text-sm font-medium"
      >
        <PauseCircle className="w-4 h-4" /> Pausar membresía
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-olimpo-surface border border-olimpo-surface-light rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-olimpo-surface-light">
              <h2 className="text-lg font-bold text-olimpo-gold flex items-center gap-2">
                <PauseCircle className="w-4 h-4" /> Pausar membresía
              </h2>
              <button onClick={reset} className="text-olimpo-text-muted hover:text-olimpo-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-olimpo-green/20 border border-olimpo-green/30 flex items-center justify-center">
                  <Check className="w-7 h-7 text-olimpo-green" />
                </div>
                <p className="text-olimpo-text font-semibold">Membresía pausada</p>
                <p className="text-sm text-olimpo-text-muted">
                  Nuevo vencimiento: <span className="text-olimpo-gold font-bold">{new Date(success + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}</span>
                </p>
                <button onClick={reset} className="mt-2 px-4 py-2 rounded-lg bg-olimpo-gold text-black font-bold text-sm">
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <p className="text-xs text-olimpo-text-muted bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2">
                  Política del gimnasio: <strong className="text-olimpo-text">no se repone tiempo</strong>, salvo aviso con causa justificada (ej. enfermedad con receta médica). Vencimiento actual: <strong className="text-olimpo-text">{new Date(currentEnd + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}</strong>.
                </p>

                <div>
                  <label className="block text-xs text-olimpo-text-muted mb-1">Días a pausar (1–90) *</label>
                  <input
                    type="number" min="1" max="90" required
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-olimpo-text-muted mb-1">Motivo *</label>
                  <textarea
                    required rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Enfermedad con receta médica, viaje, etc."
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-olimpo-text-muted mb-1">Comprobante (opcional, ej. receta médica)</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-olimpo-surface-light text-olimpo-text-muted hover:text-olimpo-gold hover:border-olimpo-gold/50 transition-colors text-sm disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    {uploading ? "Subiendo..." : proofUrl ? "Comprobante adjuntado ✓" : "Adjuntar comprobante"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
                </div>

                {error && (
                  <p className="text-olimpo-red text-sm bg-olimpo-red/10 border border-olimpo-red/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={reset}
                    className="flex-1 py-2.5 rounded-lg border border-olimpo-surface-light text-olimpo-text-muted hover:text-olimpo-text transition-colors text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading || uploading}
                    className="flex-1 py-2.5 rounded-lg bg-olimpo-gold text-black font-bold hover:bg-olimpo-gold-light transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Pausar membresía"}
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
