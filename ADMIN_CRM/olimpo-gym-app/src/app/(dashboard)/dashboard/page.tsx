import { auth } from "@/auth";
import { Users, UserX, DollarSign, Cake, ArrowUpRight, AlertTriangle, MessageCircle } from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import { db } from "@/db";
import { systemUsers, gyms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GymFilter } from "@/components/dashboard/GymFilter";
import Link from "next/link";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ gymId?: string }> }) {
  const session = await auth();
  const userName = session?.user?.name?.split(" ")[0] || "Administrador";

  const sp = await searchParams;

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session?.user?.email!));
  
  let filterGymId = sp.gymId || "";
  
  // Force filter for secretaries
  if (currentUser.role !== "admin") {
    filterGymId = currentUser.gymId!;
  }

  const allGyms = await db.select().from(gyms);
  const data = await getDashboardData(filterGymId || undefined);

  return (
    <div className="space-y-6">
      {/* Header Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-olimpo-gold">
            Bienvenido, {userName}
          </h2>
          <p className="text-sm sm:text-base text-olimpo-text-muted mt-1">
            Aquí tienes el resumen de tu gimnasio hoy.
          </p>
        </div>
        
        {currentUser.role === "admin" && (
          <div>
            <GymFilter gyms={allGyms} currentGymId={filterGymId} />
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Miembros Card */}
        <Link href="/members" className="card-olimpo border-wave p-6 rounded-2xl overflow-hidden block hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-olimpo-text-muted">Miembros Activos</h3>
            <div className="p-2 bg-olimpo-gold/10 rounded-lg">
              <Users className="w-5 h-5 text-olimpo-gold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-olimpo-text">{data.activeCount}</span>
            <span className="text-xs text-olimpo-text-muted">
              Al día
            </span>
          </div>
        </Link>

        {/* Morosos Card */}
        <Link href="/members?status=mora" className="card-olimpo border-wave p-6 rounded-2xl overflow-hidden block hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-olimpo-text-muted">En Mora</h3>
            <div className="p-2 bg-olimpo-red/10 rounded-lg">
              <UserX className="w-5 h-5 text-olimpo-red" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-olimpo-text">{data.moraCount}</span>
            <span className="text-xs text-olimpo-red flex items-center">
              +7 días de atraso
            </span>
          </div>
        </Link>

        {/* Ingresos Card */}
        <Link href="/payments" className="card-olimpo border-wave p-6 rounded-2xl overflow-hidden block hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-olimpo-text-muted">Ingresos del Mes</h3>
            <div className="p-2 bg-olimpo-green/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-olimpo-green" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-olimpo-text">Q {data.incomeTotal.toFixed(2)}</span>
            <span className="text-xs text-olimpo-text-muted">
              Total este mes
            </span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Grupos en Mora */}
        <div className="card-olimpo rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-olimpo-surface-light flex items-center justify-between">
            <h3 className="font-semibold text-olimpo-red flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Grupos en Mora
            </h3>
            <Link href="/groups" className="text-xs bg-olimpo-surface-light px-3 py-1 rounded-full text-olimpo-text hover:text-olimpo-gold hover:bg-white/10 transition-colors font-medium">
              Ver Todos →
            </Link>
          </div>
          <div className="p-0 flex-1">
            <div className="divide-y divide-olimpo-surface-light">
              {!data.groupsInMora || data.groupsInMora.length === 0 ? (
                <div className="p-8 text-center text-olimpo-text-muted">
                  No hay grupos en mora.
                </div>
              ) : (
                data.groupsInMora.map((g: any) => (
                  <div key={g.groupId} className="p-4 flex items-center justify-between hover:bg-olimpo-surface-light/50 transition-colors">
                    <div>
                      <p className="font-medium text-olimpo-text">Grupo {g.gymPrefix}-{String(g.groupNumber).padStart(4, '0')} - {g.gymName}</p>
                      <p className="text-sm text-olimpo-text-muted mt-1">Rep: {g.repName} • {g.memberCount} miembros</p>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`https://wa.me/502${(g.repPhone || '').replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(g.repName)},%20te%20escribimos%20de%20Aquarius%20Gym.%20Notamos%20que%20la%20mensualidad%20de%20tu%20grupo%20está%20pendiente.%20Por%20favor%20ponte%20al%20día%20para%20evitar%20bloqueos.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-olimpo-surface-light text-xs font-medium rounded-lg hover:text-olimpo-gold transition-colors border border-transparent hover:border-olimpo-gold/30 flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WA
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Cumpleaños del Mes */}
        <div className="bg-olimpo-surface rounded-2xl border border-olimpo-surface-light overflow-hidden shadow-lg flex flex-col">
          <div className="p-5 border-b border-olimpo-surface-light flex items-center gap-2">
            <Cake className="w-5 h-5 text-olimpo-purple" />
            <h3 className="font-semibold text-olimpo-text">Cumpleaños de este mes</h3>
          </div>
          <div className="p-0 flex-1">
            <div className="divide-y divide-olimpo-surface-light">
              {data.birthdays.length === 0 ? (
                <div className="p-8 text-center text-olimpo-text-muted">
                  No hay cumpleaños este mes.
                </div>
              ) : (
                data.birthdays.map((bday) => (
                  <div key={bday.id} className="p-4 flex items-center justify-between hover:bg-olimpo-surface-light/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-olimpo-purple/10 flex items-center justify-center text-olimpo-purple font-bold">
                        {bday.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-olimpo-text">{bday.name} <span className="text-xs text-olimpo-text-muted ml-1">({bday.gymName})</span></p>
                        <p className="text-sm text-olimpo-text-muted">{bday.formattedDate} • Cumple {bday.age}</p>
                      </div>
                    </div>
                    <a 
                      href={`https://wa.me/502${bday.phone.replace(/\D/g, '')}?text=¡Feliz%20cumpleaños%20${encodeURIComponent(bday.name.split(' ')[0])}!%20🎉%20De%20parte%20de%20toda%20la%20familia%20Aquarius%20Gym%20te%20deseamos%20un%20día%20lleno%20de%20bendiciones%20y%20muchos%20gains.%20💪`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-olimpo-surface-light text-xs font-medium rounded-lg hover:text-olimpo-purple transition-colors border border-transparent hover:border-olimpo-purple/30"
                    >
                      Felicitar 🎉
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
