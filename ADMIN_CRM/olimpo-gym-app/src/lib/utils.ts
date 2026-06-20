export function calculateMemberStatus(membershipEndStr: string): "activo" | "mora" {
  const today = new Date();
  
  // Regla: gracia hasta el día 8 del mes siguiente al vencimiento.
  // Es decir, si el vencimiento es en el mes M, el miembro entra en mora a partir del día 9 del mes M+1.
  const endDate = new Date(membershipEndStr + "T00:00:00");
  
  // Calcular el límite de gracia: primer día del mes de vencimiento + 1 mes + 7 días
  // Por ejemplo, para vencimiento 31 de mayo:
  // Primer día de mayo: 2026-05-01
  // +1 mes: 2026-06-01
  // +7 días: 2026-06-08 (el límite de gracia es el 8 de junio)
  const graceLimit = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 8);
  
  // Si hoy es posterior al límite de gracia (mayor estricto que el 8 del mes siguiente), está en mora
  if (today > graceLimit) {
    return "mora";
  }
  return "activo";
}
