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

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Miniatura del ejercicio (GIF/video/imagen) para ver a la par de la rutina. */
function ExerciseThumb({ name, videoUrl, imageUrl }: { name: string; videoUrl: string | null; imageUrl: string | null }) {
  const ytId = videoUrl ? getYouTubeId(videoUrl) : null;
  const isGif = !ytId && !!videoUrl && /\.gif($|\?)/i.test(videoUrl);
  const isVideoFile = !ytId && !isGif && !!videoUrl && /\.(mp4|mov|webm|m4v)($|\?)/i.test(videoUrl);
  const staticImage = !ytId && !isGif && !isVideoFile ? imageUrl : null;

  const boxCls = "relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-olimpo-bg border border-olimpo-surface-light shrink-0";

  if (ytId) {
    return (
      <a href={videoUrl!} target="_blank" rel="noopener noreferrer" className={boxCls} title="Ver video en YouTube">
        <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-8 h-8 rounded-full bg-olimpo-gold/90 flex items-center justify-center">
            <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-black ml-0.5" />
          </div>
        </div>
      </a>
    );
  }

  if (isGif) {
    return (
      <div className={boxCls}>
        <img src={videoUrl!} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  if (isVideoFile) {
    return (
      <div className={boxCls}>
        <video src={videoUrl!} muted loop autoPlay playsInline className="w-full h-full object-cover" />
      </div>
    );
  }

  if (staticImage) {
    return (
      <div className={boxCls}>
        <img src={staticImage} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${boxCls} flex items-center justify-center`}>
      <Dumbbell className="w-8 h-8 text-olimpo-text-muted" />
    </div>
  );
}

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
                <ExerciseThumb name={exercise.name} videoUrl={exercise.videoUrl} imageUrl={exercise.imageUrl} />
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
