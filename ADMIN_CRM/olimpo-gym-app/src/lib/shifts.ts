/**
 * Horarios de los turnos del personal (hora local de Guatemala).
 * AM: apertura → 13:00 · PM: 13:00 → cierre.
 * Los recordatorios de cuadre empiezan 30 minutos antes del fin del turno.
 */

export const SHIFT_TIMES = {
  am: { start: 6, end: 13 }, // 6:00 – 13:00
  pm: { start: 13, end: 21 }, // 13:00 – 21:00
} as const;

export type Shift = keyof typeof SHIFT_TIMES;

export const SHIFT_LABELS: Record<Shift, string> = {
  am: "Mañana (6:00 – 13:00)",
  pm: "Tarde (13:00 – 21:00)",
};

/** Minutos antes del fin de turno en que empiezan los avisos de cuadre */
export const CLOSURE_WARNING_MINUTES = 30;

/**
 * Hora actual en Guatemala (UTC-6, sin horario de verano).
 * El Date devuelto está desplazado: leerlo SIEMPRE con métodos getUTC*.
 */
export function nowInGuatemala(): Date {
  return new Date(Date.now() - 6 * 3600_000);
}

/** Fecha YYYY-MM-DD en Guatemala */
export function todayInGuatemala(): string {
  return nowInGuatemala().toISOString().split("T")[0];
}

/** Minutos que faltan para el fin del turno (negativo si ya pasó) */
export function minutesToShiftEnd(shift: Shift, now: Date = nowInGuatemala()): number {
  const end = SHIFT_TIMES[shift].end;
  const minutesNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  return end * 60 - minutesNow;
}
