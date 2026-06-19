import { auth } from "@/auth";
import { db } from "@/db";
import { systemUsers, gyms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getFinancialData } from "@/actions/finanzas";
import { GymFilter } from "@/components/dashboard/GymFilter";
import { TrendingUp, DollarSign, Users, AlertTriangle, Clock, Building2 } from "lucide-react";

// ── Mini SVG bar chart ────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const BAR_W = 36;
  const GAP = 14;
  const H = 120;
  const W = data.length * (BAR_W + GAP) - GAP;

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H + 28} className="min-w-full">
        {data.map((d, i) => {
          const barH = Math.max(4, (d.value / max) * H);
          const x = i * (BAR_W + GAP);
          const y = H - barH;
          const isLast = i === data.length - 1;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={4}
                fill={isLast ? "#00D4E8" : "#00D4E844"}
              />
              {/* value label */}
              <text
                x={x + BAR_W / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fill="#00D4E8"
                fontWeight="600"
              >
                {d.value > 0 ? `Q${Math.round(d.value)}` : ""}
              </text>
              {/* month label */}
              <text
                x={x + BAR_W / 2}
                y={H + 18}
                textAnchor="middle"
                fontSize={10}
                fill={isLast ? "#00D4E8" : "#888"}
                fontWeight={isLast ? "700" : "400"}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Status donut (simple visual) ─────────────────────────────────────────────

function StatusRing({ active, atRisk, mora }: { active: number; atRisk: number; mora: number }) {
  const total = active + atRisk + mora || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {/* mora */}
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a1a1a" strokeWidth="3.5" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke="#ef4444" strokeWidth="3.5"
            strokeDasharray={`${pct(mora)} ${100 - pct(mora)}`}
            strokeDashoffset="0"
          />
          {/* atRisk */}
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke="#f59e0b" strokeWidth="3.5"
            strokeDasharray={`${pct(atRisk)} ${100 - pct(atRisk)}`}
            strokeDashoffset={`${-pct(mora)}`}
          />
          {/* active */}
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke="#22c55e" strokeWidth="3.5"
            strokeDasharray={`${pct(active)} ${100 - pct(active)}`}
            strokeDashoffset={`${-(pct(mora) + pct(atRisk))}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-olimpo-text">{total}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <span className="text-olimpo-text-muted">Activos</span>
          <span className="ml-auto font-bold text-olimpo-text">{active}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          <span className="text-olimpo-text-muted">Por vencer</span>
          <span className="ml-auto font-bold text-olimpo-text">{atRisk}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
          <span className="text-olimpo-text-muted">En mora</span>
          <span className="ml-auto font-bold text-red-400">{mora}</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ gymId?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;

  const [currentUser] = await db
    .select({ gymId: systemUsers.gymId, role: systemUsers.role })
    .from(systemUsers)
    .where(eq(systemUsers.email, session?.user?.email!))
    .limit(1);

  let filterGymId = sp.gymId || "";
  if (currentUser.role !== "admin") filterGymId = currentUser.gymId!;

  const allGyms = await db.select().from(gyms);
  const data = await getFinancialData(filterGymId || undefined);

  const chartData = data.months.map((m) => ({
    label: m.month,
    value: m.total,
  }));

  const currentM = data.months[data.months.length - 1];
  const prevM = data.months[data.months.length - 2];
  const growthPct =
    prevM.total > 0
      ? (((currentM.total - prevM.total) / prevM.total) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-olimpo-gold">
            Dashboard Financiero
          </h2>
          <p className="text-sm text-olimpo-text-muted mt-1">
            Ingresos, membresías y rendimiento por sede
          </p>
        </div>
        {currentUser.role === "admin" && (
          <GymFilter gyms={allGyms} currentGymId={filterGymId} basePath="/finanzas" />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-olimpo p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-olimpo-text-muted font-medium">Ingresos del mes</p>
            <DollarSign className="w-4 h-4 text-olimpo-gold" />
          </div>
          <p className="text-2xl font-bold text-olimpo-text">
            Q {data.currentMonth.total.toFixed(2)}
          </p>
          {growthPct !== null && (
            <p className={`text-xs mt-1 font-medium ${Number(growthPct) >= 0 ? "text-green-400" : "text-red-400"}`}>
              {Number(growthPct) >= 0 ? "+" : ""}{growthPct}% vs mes anterior
            </p>
          )}
        </div>

        <div className="card-olimpo p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-olimpo-text-muted font-medium">Transacciones</p>
            <TrendingUp className="w-4 h-4 text-olimpo-gold" />
          </div>
          <p className="text-2xl font-bold text-olimpo-text">{data.currentMonth.txCount}</p>
          <p className="text-xs text-olimpo-text-muted mt-1">Pagos este mes</p>
        </div>

        <div className="card-olimpo p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-olimpo-text-muted font-medium">Miembros activos</p>
            <Users className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-olimpo-text">{data.status.active}</p>
          <p className="text-xs text-olimpo-text-muted mt-1">Con membresía vigente</p>
        </div>

        <div className="card-olimpo p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-olimpo-text-muted font-medium">En mora / riesgo</p>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{data.status.mora}</p>
          <p className="text-xs text-amber-400 mt-1">+{data.status.atRisk} por vencer (7d)</p>
        </div>
      </div>

      {/* Chart + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="card-olimpo rounded-2xl overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-olimpo-surface-light flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-olimpo-gold" />
            <h3 className="font-semibold text-olimpo-text">Ingresos últimos 6 meses</h3>
          </div>
          <div className="p-6">
            <BarChart data={chartData} />
            {/* monthly vs enrollment breakdown for current month */}
            {currentM && (
              <div className="flex gap-6 mt-4 pt-4 border-t border-olimpo-surface-light text-sm">
                <div>
                  <p className="text-olimpo-text-muted text-xs">Mensualidades</p>
                  <p className="font-semibold text-olimpo-text">Q {currentM.monthly.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-olimpo-text-muted text-xs">Inscripciones</p>
                  <p className="font-semibold text-olimpo-text">Q {currentM.enrollment.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-olimpo-text-muted text-xs">Total</p>
                  <p className="font-semibold text-olimpo-gold">Q {currentM.total.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status donut */}
        <div className="card-olimpo rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-olimpo-surface-light flex items-center gap-2">
            <Users className="w-4 h-4 text-olimpo-gold" />
            <h3 className="font-semibold text-olimpo-text">Estado de membresías</h3>
          </div>
          <div className="p-6">
            <StatusRing
              active={data.status.active}
              atRisk={data.status.atRisk}
              mora={data.status.mora}
            />
            <div className="mt-5 pt-4 border-t border-olimpo-surface-light space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-olimpo-text-muted flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Vencen en 7 días
                </span>
                <span className="font-bold text-amber-400">{data.status.atRisk}</span>
              </div>
              <p className="text-xs text-olimpo-text-muted">
                Se les envía push automático recordándoles renovar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* By sede (admin only, no filter) */}
      {data.bySede.length > 0 && (
        <div className="card-olimpo rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-olimpo-surface-light flex items-center gap-2">
            <Building2 className="w-4 h-4 text-olimpo-gold" />
            <h3 className="font-semibold text-olimpo-text">Rendimiento por sede — mes actual</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-olimpo-surface-light text-olimpo-text-muted text-xs">
                  <th className="text-left p-4 font-medium">Sede</th>
                  <th className="text-right p-4 font-medium">Activos</th>
                  <th className="text-right p-4 font-medium">En mora</th>
                  <th className="text-right p-4 font-medium">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {data.bySede.map((s) => (
                  <tr
                    key={s.gymId}
                    className="border-b border-olimpo-surface-light hover:bg-olimpo-surface-light/40 transition-colors"
                  >
                    <td className="p-4 font-medium text-olimpo-text">{s.gymName}</td>
                    <td className="p-4 text-right text-green-400 font-semibold">{s.active}</td>
                    <td className="p-4 text-right text-red-400 font-semibold">{s.mora}</td>
                    <td className="p-4 text-right text-olimpo-gold font-bold">
                      Q {s.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-olimpo-surface-light/30">
                  <td className="p-4 font-bold text-olimpo-gold">TOTAL</td>
                  <td className="p-4 text-right font-bold text-green-400">
                    {data.bySede.reduce((a, s) => a + s.active, 0)}
                  </td>
                  <td className="p-4 text-right font-bold text-red-400">
                    {data.bySede.reduce((a, s) => a + s.mora, 0)}
                  </td>
                  <td className="p-4 text-right font-bold text-olimpo-gold">
                    Q {data.bySede.reduce((a, s) => a + s.revenue, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
