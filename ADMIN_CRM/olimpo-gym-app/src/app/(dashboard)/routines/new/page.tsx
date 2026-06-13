import { getExercises } from "@/actions/exercises";
import { NewRoutineClient } from "@/components/routines/NewRoutineClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewRoutinePage() {
  const exercises = await getExercises();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/routines" className="inline-flex items-center gap-2 text-olimpo-text-muted hover:text-olimpo-gold transition-colors text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver a Rutinas
        </Link>
        <h1 className="text-2xl font-serif font-bold text-olimpo-gold">Nueva Rutina</h1>
      </div>
      <NewRoutineClient exercises={exercises} />
    </div>
  );
}
