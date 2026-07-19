/**
 * Envío de correos vía Resend (https://resend.com — gratis hasta 3,000/mes).
 *
 * Variables de entorno (Vercel):
 * - RESEND_API_KEY: la API key de Resend (obligatoria para que salgan correos)
 * - CUADRE_EMAIL_TO: correo del dueño que recibe los cuadres
 * - CUADRE_EMAIL_FROM: remitente verificado en Resend
 *   (sin dominio propio verificado, usar "Aquarius Gym <onboarding@resend.dev>",
 *   que solo entrega al correo de la cuenta de Resend)
 *
 * Si falta la API key, el envío se omite con un log — el cuadre NO falla por esto.
 */

const RESEND_URL = "https://api.resend.com/emails";

export async function sendEmail(subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CUADRE_EMAIL_TO;
  const from = process.env.CUADRE_EMAIL_FROM || "Aquarius Gym <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.warn("[email] RESEND_API_KEY o CUADRE_EMAIL_TO no configurados — correo omitido:", subject);
    return false;
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error("[email] Resend error:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] fallo de red:", e);
    return false;
  }
}

export interface ClosureEmailData {
  gymName: string;
  shift: "am" | "pm";
  date: string; // YYYY-MM-DD
  secretaryName: string;
  attendanceCount: number;
  membershipPayments: { memberName: string; amount: string }[];
  productSales: { productName: string; quantity: number; total: string; status: string }[];
  dayPasses: { count: number; total: number };
  salesTotal: string; // cobrado en el turno según sistema
  countedCash: string; // efectivo contado por la secretaria
  stockOk: boolean;
  discrepancies?: string | null;
  notes?: string | null;
}

const Q = (n: number | string) => `Q${Number(n).toFixed(2)}`;

export async function sendClosureEmail(d: ClosureEmailData): Promise<boolean> {
  const [y, m, day] = d.date.split("-");
  const fecha = `${day}/${m}/${y}`;
  const subject = `Cuadre ${d.shift.toUpperCase()} ${fecha} — ${d.gymName}`;

  const membershipTotal = d.membershipPayments.reduce((s, p) => s + Number(p.amount), 0);
  const diff = Number(d.countedCash) - Number(d.salesTotal);

  const rows = (items: string[]) => items.length ? items.join("") : `<tr><td colspan="2" style="padding:6px 10px;color:#888">— Sin registros —</td></tr>`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#101418;color:#eee;border-radius:12px;overflow:hidden">
    <div style="background:#0b5d66;padding:18px 22px">
      <h2 style="margin:0;color:#fff">Cuadre ${d.shift === "am" ? "MAÑANA" : "TARDE"} — ${fecha}</h2>
      <p style="margin:4px 0 0;color:#bfe8ec">${d.gymName} · Enviado por ${d.secretaryName}</p>
    </div>
    <div style="padding:20px 22px">

      <h3 style="color:#4fd1dd;margin:0 0 6px">📊 Resumen del turno</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 10px">🚶 Asistencias del día</td><td style="padding:6px 10px;text-align:right"><b>${d.attendanceCount}</b></td></tr>
        <tr><td style="padding:6px 10px">💳 Mensualidades cobradas</td><td style="padding:6px 10px;text-align:right"><b>${d.membershipPayments.length} (${Q(membershipTotal)})</b></td></tr>
        <tr><td style="padding:6px 10px">🎟️ Pagos por día</td><td style="padding:6px 10px;text-align:right"><b>${d.dayPasses.count} (${Q(d.dayPasses.total)})</b></td></tr>
        <tr><td style="padding:6px 10px">🛒 Ventas de productos (cobrado)</td><td style="padding:6px 10px;text-align:right"><b>${Q(d.salesTotal)}</b></td></tr>
      </table>

      <h3 style="color:#4fd1dd;margin:18px 0 6px">💵 Cuadre de efectivo (tienda)</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 10px">Según sistema</td><td style="padding:6px 10px;text-align:right">${Q(d.salesTotal)}</td></tr>
        <tr><td style="padding:6px 10px">Efectivo contado</td><td style="padding:6px 10px;text-align:right">${Q(d.countedCash)}</td></tr>
        <tr><td style="padding:6px 10px"><b>Diferencia</b></td><td style="padding:6px 10px;text-align:right;color:${Math.abs(diff) < 0.01 ? "#5be08a" : "#ff7b7b"}"><b>${Q(diff)}</b></td></tr>
      </table>

      <h3 style="color:#4fd1dd;margin:18px 0 6px">📦 Inventario</h3>
      <p style="margin:0;font-size:14px;color:${d.stockOk ? "#5be08a" : "#ff7b7b"}">
        ${d.stockOk ? "✓ El inventario físico cuadró con el sistema" : `✗ FALTANTE (lo repone la secretaria): ${d.discrepancies ?? ""}`}
      </p>

      <h3 style="color:#4fd1dd;margin:18px 0 6px">🛒 Detalle de ventas del turno</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${rows(d.productSales.map((s) => `<tr><td style="padding:5px 10px">${s.quantity}× ${s.productName} <span style="color:#888">(${s.status})</span></td><td style="padding:5px 10px;text-align:right">${Q(s.total)}</td></tr>`))}
      </table>

      <h3 style="color:#4fd1dd;margin:18px 0 6px">💳 Mensualidades del turno</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${rows(d.membershipPayments.map((p) => `<tr><td style="padding:5px 10px">${p.memberName}</td><td style="padding:5px 10px;text-align:right">${Q(p.amount)}</td></tr>`))}
      </table>

      ${d.notes ? `<p style="margin-top:16px;font-size:13px;color:#aaa"><b>Notas:</b> ${d.notes}</p>` : ""}
    </div>
  </div>`;

  return sendEmail(subject, html);
}
