"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRoutine } from "@/actions/routines";
import { Plus, Trash2, GripVertical, Search } from "lucide-react";

type MuscleGroup = "pecho" | "espalda" | "hombros" | "biceps" | "triceps" | "piernas" | "gluteos" | "core" | "cardio" | "full_body";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: string | null;
  defaultRest: string | null;
  notes: string | null;
}

interface SelectedExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: string;
  rest: string;
  notes: string;
}

const MUSCLE_LABELS: Record<string, string> = {
  pecho: "Pecho", espalda: "Espalda", hombros: "Hombros",
  biceps: "Bíceps", triceps: "Tríceps", piernas: "Piernas",
  gluteos: "Glúteos", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};

export function NewRoutineClient({ exercises }: { exercises: Exercise[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dayLabel, setDayLabel] = useState("");
  const [selected, setSelected] = useState<SelectedExercise[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const filtered = exercises.filter(
    (e) =>
      !selected.find((s) => s.id === e.id) &&
      (search === "" || e.name.toLowerCase().includes(search.toLowerCase()) || MUSCLE_LABELS[e.muscleGroup]?.toLowerCase().includes(search.toLowerCase()))
  );

  function addExercise(ex: Exercise) {
    setSelected((prev) => [
      ...prev,
      { id: ex.id, name: ex.name, muscleGroup: ex.muscleGroup, sets: ex.defaultSets || "3 x 10-12", rest: ex.defaultRest || "2 min", notes: "" },
    ]);
  }

  function removeExercise(id: string) {
    setSelected((prev) => prev.filter((e) => e.id !== id));
  }

  function updateSelected(id: string, field: keyof SelectedExercise, value: string) {
    setSelected((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("El nombre es obligatorio."); return; }
    if (selected.length === 0) { setError("Agrega al menos un ejercicio."); return; }
    setError("");
    startTransition(async () => {
      try {
        const result = await createRoutine({
          name,
          description: description || undefined,
          dayLabel: dayLabel || undefined,
          exerciseIds: selected.map((s) => ({ id: s.id, sets: s.sets, rest: s.rest, notes: s.notes })),
        });
        router.push(`/routines/${result.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear rutina");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Details + selected exercises */}
      <div className="space-y-5">
        <div className="card-olimpo rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-olimpo-text">Información de la rutina</h2>
          <div>
            <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Nombre *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Tren Superior A"
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Etiqueta del día (opcional)</label>
            <input
              value={dayLabel}
              onChange={(e) => setDayLabel(e.target.value)}
              placeholder="Ej: Lunes · Pecho & Hombros"
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider mb-1.5">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Enfoque, objetivos..."
              className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm resize-none"
            />
          </div>
        </div>

        {/* Selected exercises */}
        <div className="card-olimpo rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-olimpo-text">
            Ejercicios seleccionados <span className="text-olimpo-gold">({selected.length})</span>
          </h2>
          {selected.length === 0 ? (
            <p className="text-sm text-olimpo-text-muted text-center py-4">Selecciona ejercicios del panel derecho</p>
          ) : (
            <div className="space-y-3">
              {selected.map((ex, idx) => (
                <div key={ex.id} className="bg-olimpo-bg rounded-xl p-4 border border-olimpo-surface-light">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-olimpo-gold font-bold w-5">{idx + 1}.</span>
                      <span className="font-medium text-sm text-olimpo-text">{ex.name}</span>
                    </div>
                    <button type="button" onClick={() => removeExercise(ex.id)} className="text-olimpo-text-muted hover:text-olimpo-red">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-olimpo-text-muted uppercase tracking-wider">Series x Reps</label>
                      <input
                        value={ex.sets}
                        onChange={(e) => updateSelected(ex.id, "sets", e.target.value)}
                        className="w-full mt-1 bg-olimpo-surface border border-olimpo-surface-light rounded px-2 py-1.5 text-xs text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-olimpo-text-muted uppercase tracking-wider">Descanso</label>
                      <input
                        value={ex.rest}
                        onChange={(e) => updateSelected(ex.id, "rest", e.target.value)}
                        className="w-full mt-1 bg-olimpo-surface border border-olimpo-surface-light rounded px-2 py-1.5 text-xs text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="text-[10px] text-olimpo-text-muted uppercase tracking-wider">Notas</label>
                    <input
                      value={ex.notes}
                      onChange={(e) => updateSelected(ex.id, "notes", e.target.value)}
                      placeholder="Instrucciones adicionales..."
                      className="w-full mt-1 bg-olimpo-surface border border-olimpo-surface-light rounded px-2 py-1.5 text-xs text-olimpo-text focus:outline-none focus:border-olimpo-gold"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-olimpo-red text-sm bg-olimpo-red/10 border border-olimpo-red/20 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-olimpo-gold text-black font-bold py-3 rounded-lg hover:bg-olimpo-gold-light transition-colors disabled:opacity-50"
        >
          {pending ? "Creando rutina..." : "Crear Rutina"}
        </button>
      </div>

      {/* Right: Exercise picker */}
      <div className="card-olimpo rounded-2xl p-6 space-y-4 h-fit sticky top-6">
        <h2 className="font-semibold text-olimpo-text">Banco de ejercicios</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olimpo-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio o músculo..."
            className="w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg pl-9 pr-3 py-2.5 text-olimpo-text focus:outline-none focus:border-olimpo-gold text-sm"
          />
        </div>
        {exercises.length === 0 ? (
          <p className="text-sm text-olimpo-text-muted text-center py-4">
            No hay ejercicios en el banco. <a href="/exercises" className="text-olimpo-gold hover:underline">Crear ejercicios</a>
          </p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-olimpo-text-muted text-center py-4">No se encontraron ejercicios</p>
            ) : (
              filtered.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => addExercise(ex)}
                  className="w-full text-left flex items-center justify-between gap-3 bg-olimpo-bg hover:bg-olimpo-surface-light border border-olimpo-surface-light rounded-lg px-3 py-2.5 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-olimpo-text group-hover:text-olimpo-gold transition-colors">{ex.name}</p>
                    <p className="text-xs text-olimpo-text-muted">{MUSCLE_LABELS[ex.muscleGroup]} · {ex.defaultSets}</p>
                  </div>
                  <Plus className="w-4 h-4 text-olimpo-text-muted group-hover:text-olimpo-gold transition-colors shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </form>
  );
}
