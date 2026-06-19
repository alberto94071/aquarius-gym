"use client";

import { useState, useTransition } from "react";
import { createExercise, updateExercise, deleteExercise } from "@/actions/exercises";
import { Plus, Trash2, X, Dumbbell, Play, Pencil } from "lucide-react";

type MuscleGroup = "pecho" | "espalda" | "hombros" | "biceps" | "triceps" | "piernas" | "gluteos" | "core" | "cardio" | "full_body";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: string | null;
  defaultRest: string | null;
  notes: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

const MUSCLE_COLORS: Record<string, string> = {
  pecho: "bg-red-500/20 text-red-300 border-red-500/30",
  espalda: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  hombros: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  biceps: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  triceps: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  piernas: "bg-green-500/20 text-green-300 border-green-500/30",
  gluteos: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  core: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  cardio: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  full_body: "bg-olimpo-gold/20 text-olimpo-gold border-olimpo-gold/30",
};

const ALL_MUSCLES: { value: MuscleGroup; label: string }[] = [
  { value: "pecho", label: "Pecho" },
  { value: "espalda", label: "Espalda" },
  { value: "hombros", label: "Hombros" },
  { value: "biceps", label: "Bíceps" },
  { value: "triceps", label: "Tríceps" },
  { value: "piernas", label: "Piernas" },
  { value: "gluteos", label: "Glúteos" },
  { value: "core", label: "Core" },
  { value: "cardio", label: "Cardio" },
  { value: "full_body", label: "Cuerpo completo" },
];

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function ExercisesClient({
  exercises,
  muscleLabels,
}: {
  exercises: Exercise[];
  muscleLabels: Record<string, string>;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const BLANK = { name: "", muscleGroup: "pecho" as MuscleGroup, defaultSets: "3 x 10-12", defaultRest: "2 min", notes: "", imageUrl: "", videoUrl: "" };
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");

  const filtered = filter === "all" ? exercises : exercises.filter((e) => e.muscleGroup === filter);

  function openEdit(ex: Exercise) {
    setEditingId(ex.id);
    setForm({ name: ex.name, muscleGroup: ex.muscleGroup, defaultSets: ex.defaultSets ?? "3 x 10-12", defaultRest: ex.defaultRest ?? "2 min", notes: ex.notes ?? "", imageUrl: ex.imageUrl ?? "", videoUrl: ex.videoUrl ?? "" });
    setError("");
    setShowForm(true);
  }

  function openNew() {
    setEditingId(null);
    setForm(BLANK);
    setError("");
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          muscleGroup: form.muscleGroup,
          defaultSets: form.defaultSets,
          defaultRest: form.defaultRest,
          notes: form.notes || undefined,
          imageUrl: form.imageUrl || undefined,
          videoUrl: form.videoUrl || undefined,
        };
        if (editingId) {
          await updateExercise(editingId, payload);
        } else {
          await createExercise(payload);
        }
        setShowForm(false);
        setEditingId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar ejercicio");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este ejercicio? Se eliminará de todas las rutinas.")) return;
    startTransition(async () => { await deleteExercise(id); });
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === "all" ? "bg-olimpo-gold text-black border-olimpo-gold" : "border-olimpo-surface-light text-olimpo-text-muted hover:border-olimpo-gold/50"
            }`}
          >
            Todos ({exercises.length})
          </button>
          {ALL_MUSCLES.map((m) => {
            const count = exercises.filter((e) => e.muscleGroup === m.value).length;
            if (count === 0) return null;
            return (
              <button
                key={m.value}
                onClick={() => setFilter(m.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  filter === m.value ? "bg-olimpo-gold text-black border-olimpo-gold" : "border-olimpo-surface-light text-olimpo-text-muted hover:border-olimpo-gold/50"
                }`}
              >
                {m.label} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-olimpo-gold text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-olimpo-gold-light transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Nuevo Ejercicio
        </button>
      </div>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <div className="card-olimpo rounded-2xl p-12 text-center">
          <Dumbbell className="w-10 h-10 text-olimpo-text-muted mx-auto mb-3" />
          <p className="text-olimpo-text-muted">No hay ejercicios{filter !== "all" ? " en esta categoría" : ""}. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ex) => {
            const ytId = ex.videoUrl ? getYouTubeId(ex.videoUrl) : null;
            const thumbnail = ytId
              ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
              : ex.imageUrl || null;

            return (
              <div key={ex.id} className="card-olimpo rounded-xl p-4 flex flex-col gap-3">
                {/* Thumbnail / video preview */}
                {thumbnail && (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden bg-olimpo-bg">
                    <img src={thumbnail} alt={ex.name} className="w-full h-full object-cover" />
                    {ytId && (
                      <a
                        href={ex.videoUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </a>
                    )}
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-olimpo-text text-sm">{ex.name}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ytId && (
                      <span className="text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-600/30 px-1.5 py-0.5 rounded">
                        VIDEO
                      </span>
                    )}
                    <button
                      onClick={() => openEdit(ex)}
                      disabled={pending}
                      className="text-olimpo-text-muted hover:text-olimpo-gold transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ex.id)}
                      disabled={pending}
                      className="text-olimpo-text-muted hover:text-olimpo-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <span className={`self-start px-2.5 py-1 rounded-full text-xs font-semibold border ${MUSCLE_COLORS[ex.muscleGroup] || ""}`}>
                  {muscleLabels[ex.muscleGroup] ?? ex.muscleGroup}
                </span>
                <div className="flex gap-3 text-xs text-olimpo-text-muted">
                  {ex.defaultSets && <span>📊 {ex.defaultSets}</span>}
                  {ex.defaultRest && <span>⏱ {ex.defaultRest}</span>}
                </div>
                {ex.notes && <p className="text-xs text-olimpo-text-muted italic">{ex.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-olimpo-surface border border-olimpo-surface-light rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-olimpo-surface-light sticky top-0 bg-olimpo-surface z-10">
              <h2 className="font-bold text-olimpo-gold text-lg">{editingId ? "Editar Ejercicio" : "Nuevo Ejercicio"}</h2>
              <button onClick={() => setShowForm(false)} className="text-olimpo-text-muted hover:text-olimpo-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Nombre</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                  placeholder="Ej: Press de banca"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Grupo Muscular</label>
                <select
                  value={form.muscleGroup}
                  onChange={(e) => setForm({ ...form, muscleGroup: e.target.value as MuscleGroup })}
                  className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                >
                  {ALL_MUSCLES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Series x Reps</label>
                  <input
                    value={form.defaultSets}
                    onChange={(e) => setForm({ ...form, defaultSets: e.target.value })}
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                    placeholder="3 x 10-12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Descanso</label>
                  <input
                    value={form.defaultRest}
                    onChange={(e) => setForm({ ...form, defaultRest: e.target.value })}
                    className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                    placeholder="2 min"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Notas (opcional)</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                  placeholder="Instrucciones, forma correcta..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">
                  🎬 URL de Video YouTube (del instructor)
                </label>
                <input
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                  placeholder="https://youtube.com/watch?v=..."
                />
                {form.videoUrl && getYouTubeId(form.videoUrl) && (
                  <div className="mt-2 relative rounded-lg overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeId(form.videoUrl)}/mqdefault.jpg`}
                      className="w-full h-24 object-cover rounded-lg"
                      alt="Preview"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                        <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-2 text-[10px] text-white font-bold">Vista previa ✓</span>
                  </div>
                )}
                <p className="text-[10px] text-olimpo-text-muted mt-1">
                  El video se reproducirá dentro de la app sin salir a YouTube.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">URL de imagen (opcional)</label>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
                  placeholder="https://... (si no hay video)"
                />
              </div>
              {error && <p className="text-olimpo-red text-sm">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="w-full bg-olimpo-gold text-black font-bold py-3 rounded-lg hover:bg-olimpo-gold-light transition-colors disabled:opacity-50 text-sm"
              >
                {pending ? "Guardando..." : editingId ? "Guardar cambios" : "Crear Ejercicio"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
