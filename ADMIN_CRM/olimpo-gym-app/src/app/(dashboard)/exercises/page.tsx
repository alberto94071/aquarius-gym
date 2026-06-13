import { getExercises } from "@/actions/exercises";
import { ExercisesClient } from "@/components/exercises/ExercisesClient";
import { Dumbbell } from "lucide-react";

const MUSCLE_LABELS: Record<string, string> = {
  pecho: "Pecho", espalda: "Espalda", hombros: "Hombros",
  biceps: "Bíceps", triceps: "Tríceps", piernas: "Piernas",
  gluteos: "Glúteos", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};

export default async function ExercisesPage() {
  const items = await getExercises();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-olimpo-gold flex items-center gap-3">
            <Dumbbell className="w-6 h-6" /> Banco de Ejercicios
          </h1>
          <p className="text-olimpo-text-muted text-sm mt-1">
            {items.length} ejercicio{items.length !== 1 ? "s" : ""} registrado{items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <ExercisesClient exercises={items} muscleLabels={MUSCLE_LABELS} />
    </div>
  );
}
