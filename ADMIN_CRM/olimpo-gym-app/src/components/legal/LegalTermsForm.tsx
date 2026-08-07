"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishTerms } from "@/actions/legal";
import { Loader2, Eye, Save, AlertTriangle } from "lucide-react";

export function LegalTermsForm({
  currentVersion,
  currentTitle,
  currentContentHtml,
}: {
  currentVersion: number | null;
  currentTitle: string;
  currentContentHtml: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(currentTitle);
  const [contentHtml, setContentHtml] = useState(currentContentHtml);
  const [showPreview, setShowPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<number | null>(null);

  const dirty = title !== currentTitle || contentHtml !== currentContentHtml;

  async function handlePublish() {
    setSaving(true);
    setError("");
    try {
      const res = await publishTerms({ title, contentHtml });
      setSuccess(res.version);
      setConfirming(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al publicar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-olimpo-surface border border-olimpo-surface-light rounded-xl px-4 py-3">
        <span className="text-sm text-olimpo-text-muted">
          {currentVersion ? (
            <>Versión vigente: <strong className="text-olimpo-gold">v{currentVersion}</strong></>
          ) : (
            <span className="text-olimpo-red">Aún no hay ninguna versión publicada — la app no pedirá aceptación hasta que publiques la primera.</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-olimpo-gold hover:underline"
        >
          <Eye className="w-4 h-4" /> {showPreview ? "Ocultar" : "Ver"} vista previa
        </button>
      </div>

      {success && (
        <div className="bg-olimpo-green/20 border border-olimpo-green/50 text-olimpo-green p-3 rounded-lg text-sm font-medium text-center">
          ✓ Versión {success} publicada. A partir de ahora, todos los miembros deberán aceptarla en su próximo inicio de sesión.
        </div>
      )}
      {error && <p className="text-olimpo-red text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-olimpo-text-muted mb-1">Título del documento</label>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSuccess(null); }}
          className="w-full px-3 py-2 bg-olimpo-surface border border-olimpo-surface-light rounded-xl text-olimpo-text focus:outline-none focus:border-olimpo-gold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-olimpo-text-muted mb-1">
          Contenido (HTML — se muestra dentro de la app con estilos oscuros/dorados)
        </label>
        <textarea
          value={contentHtml}
          onChange={(e) => { setContentHtml(e.target.value); setSuccess(null); }}
          rows={24}
          spellCheck={false}
          className="w-full px-3 py-2 bg-olimpo-bg border border-olimpo-surface-light rounded-xl text-olimpo-text font-mono text-xs focus:outline-none focus:border-olimpo-gold"
        />
      </div>

      {showPreview && (
        <div className="rounded-xl border border-olimpo-surface-light overflow-hidden bg-black">
          <iframe
            title="Vista previa"
            sandbox=""
            srcDoc={`<html><head><meta charset="utf-8"><style>
              body{background:#0a0a0a;color:#eee;font-family:sans-serif;padding:20px;line-height:1.6;}
              h2,h3{color:#f0b429;} a{color:#f0b429;} hr{border-color:#333;}
            </style></head><body>${contentHtml}</body></html>`}
            className="w-full h-[500px]"
          />
        </div>
      )}

      {!confirming ? (
        <button
          type="button"
          disabled={!dirty || !title.trim() || !contentHtml.trim()}
          onClick={() => setConfirming(true)}
          className="px-5 py-2.5 rounded-xl bg-olimpo-gold text-black font-bold hover:bg-olimpo-gold/90 disabled:opacity-40 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Publicar nueva versión
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-olimpo-red/10 border border-olimpo-red/40 space-y-3">
          <p className="text-sm text-olimpo-red font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Todos los miembros deberán volver a leer y aceptar este documento la próxima vez que abran la app. ¿Confirmas?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="px-4 py-2 rounded-lg text-olimpo-text-muted hover:bg-olimpo-surface-light"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handlePublish}
              className="px-4 py-2 rounded-lg bg-olimpo-red text-white font-bold hover:bg-olimpo-red/90 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, publicar y forzar reaceptación"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
