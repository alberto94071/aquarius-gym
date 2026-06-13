"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRoutine } from "@/actions/routines";
import { Trash2 } from "lucide-react";

export function DeleteRoutineButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("¿Eliminar esta rutina? Se desasignará de todos los miembros.")) return;
    startTransition(async () => {
      await deleteRoutine(id);
      router.push("/routines");
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="flex items-center gap-2 text-olimpo-red border border-olimpo-red/30 px-3 py-1.5 rounded-lg text-sm hover:bg-olimpo-red/10 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
