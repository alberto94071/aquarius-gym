import { getRoutineById } from "@/actions/routines";
import { ArrowLeft, Dumbbell, Clock, BarChart2, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteRoutineButton } from "@/components/routines/DeleteRoutineButton";

const MUSCLE_LABELS: Record<string, string> = {
  pecho: "Pecho", espalda: "Espalda", hombros: "Hombros",
  biceps: "Bíceps", triceps: "Tríceps", piernas: "Piernas",
  gluteos: "Glúteos", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};

export default async function RoutineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const routine = await getRoutineById(id);
  if (!routine) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link href="/routines" className="inline-flex items-center gap-2 text-olimpo-text-muted hover:text-olimpo-gold transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a Rutinas
        </Link>
        <DeleteRoutineButton id={routine.id} />
      </div>

      {/* Header */}
      <div className="card-olimpo rounded-2xl p-6">
        <h1 className="text-2xl font-serif font-bold text-olimpo-gold">{routine.name}</h1>
        {routine.dayLabel && <p className="text-olimpo-gold/70 text-sm mt-1">{routine.dayLabel}</p>}
        {routine.description && <p className="text-olimpo-text-muted mt-3 text-sm">{routine.description}</p>}
        <div className="flex gap-4 mt-4 text-xs text-olimpo-text-muted">
          <span className="flex items-center gap-1.5"><Dumbbell className="w-3.5 h-3.5" /> {routine.exercises.length} ejercicios</span>
          <span>Creada {new Date(routine.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* Exercises list */}
      <div className="card-olimpo rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-olimpo-surface-light">
          <h2 className="font-semibold text-olimpo-text">Ejercicios de la rutina</h2>
        </div>
        {routine.exercises.length === 0 ? (
          <div className="p-8 text-center text-olimpo-text-muted">Esta rutina no tiene ejercicios.</div>
        ) : (
          <div className="divide-y divide-olimpo-surface-light">
            {routine.exercises.map(({ re, exercise }, idx) => (
              <div key={re.id} className="p-5 flex gap-4 items-start">
                <span className="text-2xl font-serif font-bold text-olimpo-gold/30 w-8 shrink-0 pt-0.5">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-olimpo-text">{exercise.name}</p>
                      <p className="text-xs text-olimpo-text-muted mt-0.5">{MUSCLE_LABELS[exercise.muscleGroup]}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-olimpo-text-muted">
                    <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> {re.sets || exercise.defaultSets || "3 x 10-12"}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {re.rest || exercise.defaultRest || "2 min"}</span>
                  </div>
                  {(re.notes || exercise.notes) && (
                    <p className="text-xs text-olimpo-text-muted mt-2 italic">{re.notes || exercise.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
