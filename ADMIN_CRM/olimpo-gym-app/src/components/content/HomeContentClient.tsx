"use client";

import { useState, useTransition } from "react";
import { createHomeContent, deleteHomeContent, toggleHomeContentPublished } from "@/actions/homeContent";
import { Plus, Trash2, X, Eye, EyeOff, Video, FileText, Lightbulb, Image } from "lucide-react";

type ContentType = "video" | "article" | "tip" | "image";

interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  body: string | null;
  url: string | null;
  imageUrl: string | null;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
}

const TYPE_CONFIG: Record<ContentType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  video: { label: "Video", icon: Video, color: "bg-red-500/20 text-red-300 border-red-500/30" },
  article: { label: "Artículo", icon: FileText, color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  tip: { label: "Tip", icon: Lightbulb, color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  image: { label: "Imagen", icon: Image, color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function HomeContentClient({ items }: { items: ContentItem[] }) {
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ type: "video" as ContentType, title: "", body: "", url: "", imageUrl: "", sortOrder: "0" });
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await createHomeContent({
          type: form.type,
          title: form.title,
          body: form.body || undefined,
          url: form.url || undefined,
          imageUrl: form.imageUrl || undefined,
          sortOrder: parseInt(form.sortOrder) || 0,
        });
        setForm({ type: "video", title: "", body: "", url: "", imageUrl: "", sortOrder: "0" });
        setShowForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-olimpo-gold text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-olimpo-gold-light transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Contenido
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card-olimpo rounded-2xl p-12 text-center">
          <p className="text-olimpo-text-muted">No hay contenido publicado todavía. Agrega videos, artículos o tips para los miembros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => {
            const cfg = TYPE_CONFIG[item.type];
            const Icon = cfg.icon;
            const ytId = item.type === "video" && item.url ? getYouTubeId(item.url) : null;

            return (
              <div key={item.id} className={`card-olimpo rounded-xl overflow-hidden flex flex-col ${!item.published ? "opacity-60" : ""}`}>
                {ytId ? (
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt={item.title}
                    className="w-full h-36 object-cover"
                  />
                ) : item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-20 bg-olimpo-surface-light flex items-center justify-center">
                    <Icon className="w-8 h-8 text-olimpo-text-muted" />
                  </div>
                )}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start gap-2 justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>{cfg.label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startTransition(async () => { await toggleHomeContentPublished(item.id, !item.published); })}
                        className="text-olimpo-text-muted hover:text-olimpo-gold transition-colors"
                        title={item.published ? "Ocultar" : "Publicar"}
                      >
                        {item.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { if (confirm("¿Eliminar este contenido?")) startTransition(async () => { await deleteHomeContent(item.id); }); }}
                        className="text-olimpo-text-muted hover:text-olimpo-red transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold text-olimpo-text text-sm line-clamp-2">{item.title}</p>
                  {item.body && <p className="text-xs text-olimpo-text-muted line-clamp-2">{item.body}</p>}
                  {!item.published && <span className="text-[10px] text-olimpo-text-muted font-semibold">OCULTO</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-olimpo-surface border border-olimpo-surface-light rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-olimpo-surface-light">
              <h2 className="font-bold text-olimpo-gold text-lg">Nuevo Contenido</h2>
              <button onClick={() => setShowForm(false)} className="text-olimpo-text-muted hover:text-olimpo-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Tipo</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(TYPE_CONFIG) as ContentType[]).map((t) => {
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                          form.type === t ? "bg-olimpo-gold text-black border-olimpo-gold" : "border-olimpo-surface-light text-olimpo-text-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Título *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                  placeholder="Título del contenido..."
                />
              </div>
              {(form.type === "video" || form.type === "article") && (
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">
                    {form.type === "video" ? "URL de YouTube" : "URL del artículo"}
                  </label>
                  <input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                    placeholder="https://..."
                  />
                </div>
              )}
              {(form.type === "image" || form.type === "tip") && (
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">URL de imagen</label>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                    placeholder="https://..."
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Descripción (opcional)</label>
                <textarea
                  rows={2}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm resize-none"
                  placeholder="Descripción breve..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Orden (menor = primero)</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                />
              </div>
              {error && <p className="text-olimpo-red text-sm">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="w-full bg-olimpo-gold text-black font-bold py-3 rounded-lg hover:bg-olimpo-gold-light transition-colors disabled:opacity-50 text-sm"
              >
                {pending ? "Guardando..." : "Publicar Contenido"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
