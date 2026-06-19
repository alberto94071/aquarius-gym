"use client";

import { useState, useTransition } from "react";
import { createHomeContent, updateHomeContent, deleteHomeContent, toggleHomeContentPublished, toggleHomeContentPinned } from "@/actions/homeContent";
import { Plus, Trash2, X, Eye, EyeOff, Video, FileText, Lightbulb, Image, Bell, Pin, Pencil } from "lucide-react";

type ContentType = "video" | "article" | "tip" | "image" | "notice";

interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  body: string | null;
  url: string | null;
  imageUrl: string | null;
  published: boolean;
  pinned: boolean;
  sortOrder: number;
  createdAt: Date;
}

const TYPE_CONFIG: Record<ContentType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  video:   { label: "Video",   icon: Video,     color: "bg-red-500/20 text-red-300 border-red-500/30" },
  article: { label: "Artículo", icon: FileText,  color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  tip:     { label: "Tip",     icon: Lightbulb, color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  image:   { label: "Imagen",  icon: Image,     color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  notice:  { label: "Noticia/Aviso", icon: Bell, color: "bg-olimpo-gold/20 text-olimpo-gold border-olimpo-gold/30" },
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const BLANK_FORM = { type: "video" as ContentType, title: "", body: "", url: "", imageUrl: "", sortOrder: "0", pinned: false };

export function HomeContentClient({ items }: { items: ContentItem[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(BLANK_FORM);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<ContentType | "all">("all");

  const filtered = filterType === "all" ? items : items.filter((i) => i.type === filterType);
  const pinned = filtered.filter((i) => i.pinned);
  const rest = filtered.filter((i) => !i.pinned);
  const displayed = [...pinned, ...rest];

  function openEdit(item: ContentItem) {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      body: item.body ?? "",
      url: item.url ?? "",
      imageUrl: item.imageUrl ?? "",
      sortOrder: String(item.sortOrder),
      pinned: item.pinned,
    });
    setError("");
    setShowForm(true);
  }

  function openNew() {
    setEditingId(null);
    setForm(BLANK_FORM);
    setError("");
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const payload = {
          type: form.type,
          title: form.title,
          body: form.body || null,
          url: form.url || null,
          imageUrl: form.imageUrl || null,
          sortOrder: parseInt(form.sortOrder) || 0,
          pinned: form.pinned,
        };
        if (editingId) {
          await updateHomeContent(editingId, payload);
        } else {
          await createHomeContent({ ...payload, body: payload.body ?? undefined, url: payload.url ?? undefined, imageUrl: payload.imageUrl ?? undefined });
        }
        setShowForm(false);
        setEditingId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  const typeKeys = Object.keys(TYPE_CONFIG) as ContentType[];

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterType === "all" ? "bg-olimpo-gold text-black border-olimpo-gold" : "border-olimpo-surface-light text-olimpo-text-muted hover:border-olimpo-gold/50"}`}
          >
            Todos ({items.length})
          </button>
          {typeKeys.map((t) => {
            const count = items.filter((i) => i.type === t).length;
            if (count === 0) return null;
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterType === t ? "bg-olimpo-gold text-black border-olimpo-gold" : "border-olimpo-surface-light text-olimpo-text-muted hover:border-olimpo-gold/50"}`}
              >
                {TYPE_CONFIG[t].label} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-olimpo-gold text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-olimpo-gold-light transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Agregar Contenido
        </button>
      </div>

      {/* Grid */}
      {displayed.length === 0 ? (
        <div className="card-olimpo rounded-2xl p-12 text-center">
          <p className="text-olimpo-text-muted">No hay contenido. Agrega videos, artículos, tips o avisos para los miembros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((item) => {
            const cfg = TYPE_CONFIG[item.type];
            const Icon = cfg.icon;
            const ytId = item.type === "video" && item.url ? getYouTubeId(item.url) : null;

            return (
              <div key={item.id} className={`card-olimpo rounded-xl overflow-hidden flex flex-col ${!item.published ? "opacity-60" : ""} ${item.pinned ? "ring-1 ring-olimpo-gold/40" : ""}`}>
                {/* Pinned banner */}
                {item.pinned && (
                  <div className="bg-olimpo-gold/10 border-b border-olimpo-gold/20 px-3 py-1 flex items-center gap-1.5">
                    <Pin className="w-3 h-3 text-olimpo-gold" />
                    <span className="text-[10px] font-bold text-olimpo-gold tracking-wider">FIJADO</span>
                  </div>
                )}

                {/* Thumbnail */}
                {ytId ? (
                  <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={item.title} className="w-full h-36 object-cover" />
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
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(item)}
                        className="text-olimpo-text-muted hover:text-olimpo-gold transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {/* Pin toggle */}
                      <button
                        onClick={() => startTransition(async () => { await toggleHomeContentPinned(item.id, !item.pinned); })}
                        className={`transition-colors ${item.pinned ? "text-olimpo-gold" : "text-olimpo-text-muted hover:text-olimpo-gold"}`}
                        title={item.pinned ? "Desfijar" : "Fijar al tope"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      {/* Publish toggle */}
                      <button
                        onClick={() => startTransition(async () => { await toggleHomeContentPublished(item.id, !item.published); })}
                        className="text-olimpo-text-muted hover:text-olimpo-gold transition-colors"
                        title={item.published ? "Ocultar" : "Publicar"}
                      >
                        {item.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => { if (confirm("¿Eliminar este contenido?")) startTransition(async () => { await deleteHomeContent(item.id); }); }}
                        className="text-olimpo-text-muted hover:text-olimpo-red transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold text-olimpo-text text-sm line-clamp-2">{item.title}</p>
                  {item.body && <p className="text-xs text-olimpo-text-muted line-clamp-2">{item.body.replace(/<[^>]+>/g, "")}</p>}
                  {!item.published && <span className="text-[10px] text-olimpo-text-muted font-semibold">OCULTO</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-olimpo-surface border border-olimpo-surface-light rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-olimpo-surface-light sticky top-0 bg-olimpo-surface z-10">
              <h2 className="font-bold text-olimpo-gold text-lg">{editingId ? "Editar Contenido" : "Nuevo Contenido"}</h2>
              <button onClick={() => setShowForm(false)} className="text-olimpo-text-muted hover:text-olimpo-text"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {typeKeys.map((t) => {
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${form.type === t ? "bg-olimpo-gold text-black border-olimpo-gold" : "border-olimpo-surface-light text-olimpo-text-muted"}`}
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

              {(form.type === "image" || form.type === "tip" || form.type === "notice") && (
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">URL de imagen</label>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                    placeholder="https://..."
                  />
                  {form.imageUrl && (
                    <img src={form.imageUrl} className="mt-2 w-full h-24 object-cover rounded-lg" alt="preview" />
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Descripción (opcional)</label>
                <textarea
                  rows={3}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm resize-none"
                  placeholder="Descripción breve..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Orden</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-1">
                    <div
                      onClick={() => setForm({ ...form, pinned: !form.pinned })}
                      className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${form.pinned ? "bg-olimpo-gold" : "bg-olimpo-surface-light"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.pinned ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                    <span className="text-xs font-semibold text-olimpo-text-muted flex items-center gap-1">
                      <Pin className="w-3 h-3 text-olimpo-gold" /> Fijar
                    </span>
                  </label>
                </div>
              </div>

              {error && <p className="text-olimpo-red text-sm">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="w-full bg-olimpo-gold text-black font-bold py-3 rounded-lg hover:bg-olimpo-gold-light transition-colors disabled:opacity-50 text-sm"
              >
                {pending ? "Guardando..." : editingId ? "Guardar cambios" : "Publicar Contenido"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
