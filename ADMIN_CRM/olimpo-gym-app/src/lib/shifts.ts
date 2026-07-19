/**
 * Horarios de los turnos del personal (hora local de Guatemala).
 * Cada SEDE define sus propios horarios (gyms.shift_am_start/… — los edita el
 * admin en Precios y Configuración). Estos son solo los valores por defecto.
 * Los recordatorios de cuadre empiezan 30 minutos antes del fin del turno.
 */

export type Shift = "am" | "pm";

export interface GymShiftHours {
  amStart: number;
  amEnd: number;
  pmStart: number;
  pmEnd: number;
}

export const DEFAULT_SHIFT_HOURS: GymShiftHours = { amStart: 6, amEnd: 13, pmStart: 13, pmEnd: 21 };

export function shiftLabel(shift: Shift, hours: GymShiftHours = DEFAULT_SHIFT_HOURS): string {
  return shift === "am"
    ? `Mañana (${hours.amStart}:00 – ${hours.amEnd}:00)`
    : `Tarde (${hours.pmStart}:00 – ${hours.pmEnd}:00)`;
}

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

export function shiftEndHour(shift: Shift, hours: GymShiftHours): number {
  return shift === "am" ? hours.amEnd : hours.pmEnd;
}

/** Minutos que faltan para el fin del turno (negativo si ya pasó) */
export function minutesToShiftEnd(shift: Shift, hours: GymShiftHours = DEFAULT_SHIFT_HOURS, now: Date = nowInGuatemala()): number {
  const minutesNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  return shiftEndHour(shift, hours) * 60 - minutesNow;
}

/** Convierte la fila de gyms a horas de turno */
export function gymHours(gym: { shiftAmStart: number; shiftAmEnd: number; shiftPmStart: number; shiftPmEnd: number }): GymShiftHours {
  return { amStart: gym.shiftAmStart, amEnd: gym.shiftAmEnd, pmStart: gym.shiftPmStart, pmEnd: gym.shiftPmEnd };
}
