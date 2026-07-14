/**
 * Lógica de vencimiento por ANIVERSARIO: la membresía vence el mismo día del
 * mes en que el miembro se inscribió (ej. inscrito el 14 de julio → vence el
 * 14 de agosto). Si el mes destino es más corto (ej. día 31 → febrero), se usa
 * el último día de ese mes.
 */

/** Día `anchorDay` del mes indicado, ajustado al último día si el mes es más corto. */
export function anniversaryDate(year: number, monthIndex: number, anchorDay: number): Date {
  // new Date normaliza monthIndex fuera de rango (ej. 12 → enero del año siguiente)
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(anchorDay, lastDay));
}

/** Suma meses conservando el día del mes de la fecha base (con ajuste en meses cortos). */
export function addMonthsAnniversary(date: Date, months: number): Date {
  return anniversaryDate(date.getFullYear(), date.getMonth() + months, date.getDate());
}

/** Meses que cubre cada plan. */
export function planMonths(plan: "mensual" | "trimestral" | "anual"): number {
  return plan === "mensual" ? 1 : plan === "trimestral" ? 3 : 12;
}

export function calculateMemberStatus(membershipEndStr: string): "activo" | "mora" {
  const today = new Date();

  // Regla: 7 días de gracia después de la fecha exacta de vencimiento.
  // Ej. vence el 14 → entra en mora a partir del 22 (el 21 aún es día de gracia).
  const endDate = new Date(membershipEndStr + "T00:00:00");
  const graceLimit = new Date(endDate);
  graceLimit.setDate(graceLimit.getDate() + 7);
  graceLimit.setHours(23, 59, 59, 999);

  if (today > graceLimit) {
    return "mora";
  }
  return "activo";
}
