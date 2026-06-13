import { getRoutines } from "@/actions/routines";
import { ListChecks, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function RoutinesPage() {
  const items = await getRoutines();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-olimpo-gold flex items-center gap-3">
            <ListChecks className="w-6 h-6" /> Rutinas
          </h1>
          <p className="text-olimpo-text-muted text-sm mt-1">
            {items.length} rutina{items.length !== 1 ? "s" : ""} creada{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/routines/new"
          className="flex items-center gap-2 bg-olimpo-gold text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-olimpo-gold-light transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva Rutina
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card-olimpo rounded-2xl p-12 text-center">
          <ListChecks className="w-10 h-10 text-olimpo-text-muted mx-auto mb-3" />
          <p className="text-olimpo-text-muted mb-4">No hay rutinas creadas todavía.</p>
          <Link href="/routines/new" className="bg-olimpo-gold text-black px-6 py-2 rounded-lg font-bold text-sm">
            Crear primera rutina
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((r) => (
            <Link
              key={r.id}
              href={`/routines/${r.id}`}
              className="card-olimpo rounded-xl p-5 hover:border-olimpo-gold/50 transition-colors group flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-olimpo-text group-hover:text-olimpo-gold transition-colors">{r.name}</h3>
                  {r.dayLabel && (
                    <p className="text-xs text-olimpo-gold mt-0.5">{r.dayLabel}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-olimpo-text-muted group-hover:text-olimpo-gold transition-colors shrink-0 mt-0.5" />
              </div>
              {r.description && (
                <p className="text-sm text-olimpo-text-muted line-clamp-2">{r.description}</p>
              )}
              <p className="text-xs text-olimpo-text-muted mt-auto">
                Creada {new Date(r.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
