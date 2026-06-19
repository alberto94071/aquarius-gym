import { getGroupById } from "@/actions/groups";
import { ArrowLeft, Users, Calendar, CreditCard, ShieldCheck, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getGroupById(id);

  if (!group) notFound();

  const isMora = !group.paidFull;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/groups" className="inline-flex items-center gap-2 text-olimpo-text-muted hover:text-olimpo-gold transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver a Grupos
        </Link>
        <button className="bg-olimpo-gold text-black px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Registrar Pago Grupal
        </button>
      </div>
      
      {/* Perfil Header */}
      <div className="card-olimpo p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center gap-6 border-greca">
        <div className="w-24 h-24 rounded-full bg-olimpo-surface-light border-2 border-olimpo-gold flex items-center justify-center shadow-[0_0_20px_rgba(197,165,90,0.3)]">
          <Users className="w-12 h-12 text-olimpo-gold" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <h2 className="text-3xl font-serif font-bold text-olimpo-gold">
              Grupo {group.gymPrefix}-{String(group.groupNumber).padStart(4, '0')}
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${!isMora ? "bg-olimpo-green/20 text-olimpo-green" : "bg-olimpo-red/20 text-olimpo-red"}`}>
              {group.paidFull ? "Solvente" : "En Mora"}
            </span>
          </div>
          <p className="text-olimpo-text-muted mt-2">Sede: {group.gymName}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center md:text-right bg-olimpo-surface-light/30 p-4 rounded-xl border border-white/5">
            <p className="text-sm text-olimpo-text-muted">Total a Pagar / Mes</p>
            <p className="text-2xl font-bold text-olimpo-gold">Q {Number(group.pricePerPerson) * group.members.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integrantes */}
        <div className="card-olimpo rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-olimpo-surface-light flex items-center justify-between">
            <h3 className="text-lg font-serif font-bold text-olimpo-text flex items-center gap-2">
              <Users className="w-5 h-5 text-olimpo-gold" /> Integrantes ({group.members.length})
            </h3>
          </div>
          <div className="p-0 flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-olimpo-surface-light/30 border-b border-olimpo-surface-light">
                  <th className="px-6 py-3 text-xs font-semibold text-olimpo-text-muted uppercase">Nombre</th>
                  <th className="px-6 py-3 text-xs font-semibold text-olimpo-text-muted uppercase">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-olimpo-text-muted uppercase text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olimpo-surface-light">
                {group.members.map((m) => (
                  <tr key={m.id} className="hover:bg-olimpo-surface-light/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-olimpo-text truncate">{m.name}</span>
                        {m.isRepresentative && <ShieldCheck className="w-4 h-4 text-olimpo-gold" />}
                      </div>
                      <div className="text-xs text-olimpo-text-muted mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {m.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-[10px] leading-5 font-semibold rounded-full uppercase tracking-wider ${
                        m.status === "activo" ? "bg-olimpo-green/10 text-olimpo-green" :
                        m.status === "mora" ? "bg-olimpo-red/10 text-olimpo-red" :
                        "bg-olimpo-surface-light text-olimpo-text-muted"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link href={`/members/${m.id}`} className="text-olimpo-gold hover:underline text-sm font-medium">Perfil</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div className="card-olimpo rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-olimpo-surface-light">
            <h3 className="text-lg font-serif font-bold text-olimpo-text flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-olimpo-gold" /> Historial de Pagos
            </h3>
          </div>
          <div className="p-0 flex-1 overflow-x-auto">
            {group.payments.length === 0 ? (
              <div className="p-8 text-center text-olimpo-text-muted">
                No hay pagos registrados para este grupo.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-olimpo-surface-light/30 border-b border-olimpo-surface-light">
                    <th className="px-6 py-3 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Período</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olimpo-surface-light">
                  {group.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-olimpo-surface-light/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {new Date(p.paymentDate + "T00:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-olimpo-green">
                        Q {p.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-olimpo-text-muted">
                        {p.periodStart ? new Date(p.periodStart + "T00:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" }) : '-'} al {p.periodEnd ? new Date(p.periodEnd + "T00:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
