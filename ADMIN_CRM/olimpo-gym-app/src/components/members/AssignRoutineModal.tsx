"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignRoutineToMember } from "@/actions/routines";
import { ListChecks, X, Check, ChevronRight } from "lucide-react";

interface Routine {
  id: string;
  name: string;
  dayLabel: string | null;
  description: string | null;
}

interface Props {
  memberId: string;
  routines: Routine[];
  currentRoutineId?: string | null;
}

export function AssignRoutineModal({ memberId, routines, currentRoutineId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>(currentRoutineId ?? "");
  const [success, setSuccess] = useState(false);

  function handleAssign() {
    if (!selected) return;
    startTransition(async () => {
      await assignRoutineToMember(memberId, selected);
      setSuccess(true);
      router.refresh();
      setTimeout(() => { setOpen(false); setSuccess(false); }, 1500);
    });
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSuccess(false); setSelected(currentRoutineId ?? ""); }}
        className="flex items-center gap-2 border border-olimpo-gold/50 text-olimpo-gold px-3 py-1.5 rounded-lg text-sm hover:bg-olimpo-gold/10 transition-colors font-semibold"
      >
        <ListChecks className="w-4 h-4" />
        {currentRoutineId ? "Cambiar rutina" : "Asignar rutina"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-olimpo-surface border border-olimpo-surface-light rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-olimpo-surface-light">
              <h2 className="font-bold text-olimpo-gold text-lg">Asignar Rutina</h2>
              <button onClick={() => setOpen(false)} className="text-olimpo-text-muted hover:text-olimpo-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-10 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-olimpo-green/20 border border-olimpo-green/30 flex items-center justify-center">
                  <Check className="w-7 h-7 text-olimpo-green" />
                </div>
                <p className="font-semibold text-olimpo-text">Rutina asignada</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {routines.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-olimpo-text-muted text-sm">No hay rutinas disponibles.</p>
                    <a href="/routines/new" className="text-olimpo-gold text-sm hover:underline mt-2 inline-block">Crear una rutina →</a>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {routines.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelected(r.id)}
                        className={`w-full text-left flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                          selected === r.id
                            ? "bg-olimpo-gold/10 border-olimpo-gold text-olimpo-text"
                            : "border-olimpo-surface-light hover:border-olimpo-gold/40"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm text-olimpo-text">{r.name}</p>
                          {r.dayLabel && <p className="text-xs text-olimpo-gold mt-0.5">{r.dayLabel}</p>}
                          {r.description && <p className="text-xs text-olimpo-text-muted mt-0.5 line-clamp-1">{r.description}</p>}
                        </div>
                        {selected === r.id && <Check className="w-4 h-4 text-olimpo-gold shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleAssign}
                  disabled={pending || !selected}
                  className="w-full bg-olimpo-gold text-black font-bold py-3 rounded-lg hover:bg-olimpo-gold-light transition-colors disabled:opacity-50 text-sm"
                >
                  {pending ? "Asignando..." : "Confirmar asignación"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
