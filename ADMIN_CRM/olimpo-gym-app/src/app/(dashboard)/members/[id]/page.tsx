import { getMemberById } from "@/actions/members";

const MONTHS_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function periodLabel(periodStart: string | null, periodEnd: string | null): string {
  if (!periodStart || !periodEnd) return "—";
  const d1 = new Date(periodStart + "T00:00:00");
  d1.setDate(d1.getDate() + 1);
  const d2 = new Date(periodEnd + "T00:00:00");
  if (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()) {
    return `${MONTHS_FULL[d1.getMonth()]} ${d1.getFullYear()}`;
  }
  if (d1.getFullYear() === d2.getFullYear()) {
    return `${MONTHS_SHORT[d1.getMonth()]} – ${MONTHS_SHORT[d2.getMonth()]} ${d2.getFullYear()}`;
  }
  return `${MONTHS_SHORT[d1.getMonth()]} ${d1.getFullYear()} – ${MONTHS_SHORT[d2.getMonth()]} ${d2.getFullYear()}`;
}

function getPaidMonths(paymentHistory: { periodStart: string | null; periodEnd: string | null }[]): string[] {
  const paid: string[] = [];
  for (const p of paymentHistory) {
    if (!p.periodStart || !p.periodEnd) continue;
    const d1 = new Date(p.periodStart + "T00:00:00");
    d1.setDate(d1.getDate() + 1);
    const d2 = new Date(p.periodEnd + "T00:00:00");
    const c = new Date(d1.getFullYear(), d1.getMonth(), 1);
    while (c <= d2) {
      const k = `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}`;
      if (!paid.includes(k)) paid.push(k);
      c.setMonth(c.getMonth() + 1);
    }
  }
  return paid;
}
import { ArrowLeft, Calendar, CreditCard, Clock, ShieldCheck, Dumbbell, Mail, ListChecks, BarChart2, MapPin, Phone, UserCheck } from "lucide-react";
import { MemberPhotoEdit } from "@/components/members/MemberPhotoEdit";
import { ResetPasswordButton } from "@/components/members/ResetPasswordButton";
import { MemberQR } from "@/components/members/MemberQR";
import { RegisterPaymentModal } from "@/components/members/RegisterPaymentModal";
import { AssignRoutineModal } from "@/components/members/AssignRoutineModal";
import { EditMemberModal } from "@/components/members/EditMemberModal";
import { DeleteMemberButton } from "@/components/members/DeleteMemberButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMemberActiveRoutine } from "@/actions/routines";
import { getRoutines } from "@/actions/routines";
import { auth } from "@/auth";
import { db } from "@/db";
import { systemUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function MemberDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const [currentUserRow] = await db.select().from(systemUsers).where(eq(systemUsers.email, session!.user!.email!));
  const userRole = currentUserRow?.role ?? "coach";

  const [member, activeRoutine, allRoutines] = await Promise.all([
    getMemberById(id),
    getMemberActiveRoutine(id),
    getRoutines(),
  ]);

  if (!member) notFound();

  const isMora = member.status === "mora";
  const isActive = member.status === "activo";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/members" className="inline-flex items-center gap-2 text-olimpo-text-muted hover:text-olimpo-gold transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver a Miembros
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <EditMemberModal member={member} userRole={userRole} />
          {userRole === "admin" && (
            <DeleteMemberButton memberId={id} memberName={member.name} />
          )}
          <RegisterPaymentModal
            memberId={id}
            memberName={member.name}
            memberCode={member.code}
            defaultAmount={member.price}
            membershipEnd={member.membershipEnd}
            paidMonths={getPaidMonths(member.payments)}
            gymName={member.gymName}
            enrollmentFee={member.enrollmentFee ?? undefined}
          />
        </div>
      </div>
      
      {/* Perfil Header */}
      <div className="card-olimpo p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center gap-6 border-greca">
        <MemberPhotoEdit memberId={id} initialPhotoUrl={member.photoUrl} />
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <h2 className="text-3xl font-serif font-bold text-olimpo-gold">{member.name}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isActive ? "bg-olimpo-green/20 text-olimpo-green" : isMora ? "bg-olimpo-red/20 text-olimpo-red" : "bg-olimpo-surface-light text-olimpo-text-muted"}`}>
              {member.status}
            </span>
          </div>
          <p className="text-olimpo-text-muted mt-2 flex items-center justify-center md:justify-start gap-2">
            <ShieldCheck className="w-4 h-4" /> Código: {member.code} ({member.gymName})
          </p>
        </div>
        <div className="flex flex-col gap-3 items-end">
          <div className="text-center md:text-right">
            <p className="text-sm text-olimpo-text-muted">Teléfono</p>
            <p className="font-medium text-olimpo-text">{member.phone}</p>
          </div>
          {member.email && member.email !== "sin_correo@olimpo.com" && (
            <div className="text-center md:text-right">
              <p className="text-sm text-olimpo-text-muted flex items-center gap-1 justify-end"><Mail className="w-3 h-3" /> Correo</p>
              <p className="font-medium text-olimpo-text text-sm">{member.email}</p>
            </div>
          )}
          <ResetPasswordButton memberId={id} />
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-olimpo p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Dumbbell className="w-5 h-5 text-olimpo-gold" />
            <h3 className="font-medium text-olimpo-text">Plan de Entrenamiento</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-olimpo-text-muted">Tipo:</span>
              <span className="font-medium capitalize">{member.plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-olimpo-text-muted">Tarifa:</span>
              <span className="font-medium font-bold text-olimpo-gold">Q {member.price}</span>
            </div>
          </div>
        </div>

        <div className="card-olimpo p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-olimpo-gold" />
            <h3 className="font-medium text-olimpo-text">Fechas</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-olimpo-text-muted">Inscripción:</span>
              <span className="font-medium">{new Date(member.membershipStart + "T00:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-olimpo-text-muted">Vencimiento:</span>
              <span className={`font-medium ${isMora ? "text-olimpo-red font-bold" : "text-olimpo-green"}`}>
                {new Date(member.membershipEnd + "T00:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        <div className="card-olimpo p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-olimpo-gold" />
            <h3 className="font-medium text-olimpo-text">Última Visita</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-2">
            {member.lastVisit ? (
              <span className="text-xl font-bold">{new Date(member.lastVisit + "T00:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
            ) : (
              <span className="text-olimpo-text-muted">Sin visitas registradas</span>
            )}
          </div>
        </div>

        <MemberQR code={member.code} name={member.name} />
      </div>

      {/* Address & Emergency Contact */}
      {(member.address || member.emergencyContactName) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {member.address && (
            <div className="card-olimpo p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-olimpo-gold" />
                <h3 className="font-medium text-olimpo-text">Dirección</h3>
              </div>
              <p className="text-olimpo-text-muted text-sm">{member.address}</p>
            </div>
          )}
          {member.emergencyContactName && (
            <div className="card-olimpo p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <UserCheck className="w-5 h-5 text-olimpo-gold" />
                <h3 className="font-medium text-olimpo-text">Contacto de Emergencia</h3>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-olimpo-text">{member.emergencyContactName}</p>
                {member.emergencyContactRelation && (
                  <p className="text-xs text-olimpo-text-muted uppercase tracking-wide">{member.emergencyContactRelation}</p>
                )}
                {member.emergencyContactPhone && (
                  <p className="flex items-center gap-2 text-sm text-olimpo-gold font-medium">
                    <Phone className="w-4 h-4" /> {member.emergencyContactPhone}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paid months summary */}
      {member.payments.length > 0 && (() => {
        const paidMonths = getPaidMonths(member.payments);
        const nextDate = new Date(member.membershipEnd + "T00:00:00");
        const next = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 1);
        return (
          <div className="card-olimpo rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-olimpo-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-olimpo-gold" /> Meses de membresía
            </h3>
            <div className="flex flex-wrap gap-2">
              {paidMonths.map((m) => {
                const [y, mo] = m.split("-").map(Number);
                return (
                  <span key={m} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-olimpo-green/15 text-olimpo-green border border-olimpo-green/30">
                    {MONTHS_SHORT[mo - 1]} {y}
                  </span>
                );
              })}
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-olimpo-gold/15 text-olimpo-gold border border-olimpo-gold/40 flex items-center gap-1">
                → {MONTHS_SHORT[next.getMonth()]} {next.getFullYear()}
              </span>
            </div>
            <p className="text-xs text-olimpo-text-muted mt-3">
              Pagado hasta el <strong className="text-olimpo-text">{new Date(member.membershipEnd + "T00:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}</strong>.
              Próximo cobro: <strong className="text-olimpo-gold">{MONTHS_FULL[next.getMonth()]} {next.getFullYear()}</strong>
            </p>
          </div>
        );
      })()}

      {/* Routine Section */}
      <div className="card-olimpo rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif font-bold text-olimpo-text flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-olimpo-gold" /> Rutina Asignada
          </h3>
          <AssignRoutineModal
            memberId={id}
            routines={allRoutines}
            currentRoutineId={activeRoutine?.id ?? null}
          />
        </div>
        {activeRoutine ? (
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <p className="font-bold text-olimpo-gold text-base">{activeRoutine.name}</p>
                {activeRoutine.dayLabel && <p className="text-xs text-olimpo-text-muted mt-0.5">{activeRoutine.dayLabel}</p>}
                {activeRoutine.description && <p className="text-sm text-olimpo-text-muted mt-1">{activeRoutine.description}</p>}
              </div>
              <Link href={`/routines/${activeRoutine.id}`} className="text-xs text-olimpo-gold hover:underline shrink-0">Ver rutina →</Link>
            </div>
            {activeRoutine.exercises.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeRoutine.exercises.map(({ re, exercise }) => (
                  <span key={re.id} className="px-2.5 py-1 rounded-full text-xs bg-olimpo-surface-light text-olimpo-text flex items-center gap-1.5">
                    <BarChart2 className="w-3 h-3 text-olimpo-gold" />
                    {exercise.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-olimpo-text-muted text-sm">Este miembro no tiene una rutina asignada. Asígnale una para que pueda verla en la app.</p>
        )}
      </div>

      {/* Payment History */}
      <div className="card-olimpo rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-olimpo-surface-light">
          <h3 className="text-lg font-serif font-bold text-olimpo-text flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-olimpo-gold" /> Historial de Pagos
          </h3>
        </div>
        <div className="p-0 overflow-x-auto">
          {member.payments.length === 0 ? (
            <div className="p-8 text-center text-olimpo-text-muted">
              No hay pagos registrados para este miembro.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-olimpo-surface-light/30 border-b border-olimpo-surface-light">
                  <th className="px-6 py-4 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Fecha de pago</th>
                  <th className="px-6 py-4 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Meses cubiertos</th>
                  <th className="px-6 py-4 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olimpo-surface-light">
                {member.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-olimpo-surface-light/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {new Date(p.paymentDate + "T00:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-olimpo-green">
                      Q {p.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {p.periodEnd ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-olimpo-green/15 text-olimpo-green border border-olimpo-green/30">
                          {periodLabel(p.periodStart, p.periodEnd)}
                        </span>
                      ) : (
                        <span className="text-olimpo-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-olimpo-text-muted">
                      {p.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
