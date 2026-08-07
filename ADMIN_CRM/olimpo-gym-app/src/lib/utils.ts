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

export type RealPlan = "semanal" | "quincenal" | "mensual" | "trimestral";

/**
 * Sábado de la semana (lunes-sábado) que contiene `date`.
 * Regla del negocio: "los planes semanales inician lunes y vencen sábado" —
 * si te inscribes a mitad de semana, tu primera semana es más corta y vence
 * el sábado de esa misma semana calendario.
 */
export function weeklyPlanEnd(date: Date): Date {
  const day = date.getDay(); // 0=domingo ... 6=sábado
  const daysToSaturday = (6 - day + 7) % 7;
  const end = new Date(date);
  end.setDate(end.getDate() + daysToSaturday);
  return end;
}

/** Suma días corridos (plan quincenal: 15 días desde la inscripción). */
export function addDaysPlain(date: Date, days: number): Date {
  const end = new Date(date);
  end.setDate(end.getDate() + days);
  return end;
}

/**
 * Fecha de vencimiento según el plan real del negocio, a partir de la fecha
 * de inicio. Semanal y quincenal usan ciclos cortos; mensual y trimestral
 * usan el aniversario del día de inscripción.
 */
export function calculateMembershipEnd(plan: RealPlan, startDate: Date): Date {
  switch (plan) {
    case "semanal":
      return weeklyPlanEnd(startDate);
    case "quincenal":
      return addDaysPlain(startDate, 15);
    case "mensual":
      return addMonthsAnniversary(startDate, 1);
    case "trimestral":
      return addMonthsAnniversary(startDate, 3);
  }
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
