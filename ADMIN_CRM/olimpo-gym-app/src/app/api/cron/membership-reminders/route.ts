import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, pushSubscriptions, memberNotifications, gyms } from "@/db/schema";
import { eq, sql, and, inArray, lt, ne } from "drizzle-orm";
import { sendExpoPush } from "@/lib/expo-push";

// Protegido con CRON_SECRET — Vercel Cron envía GET con Authorization: Bearer {secret}
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // ── 1. Actualizar estados automáticamente ────────────────────────────
    // Regla: 7 días de gracia después de la fecha exacta de vencimiento.
    // mora si: membershipEnd + 7 días de gracia < hoy

    // Marcar como "mora" a quienes superaron el plazo de gracia
    await db.update(members)
      .set({ status: "mora", paid: false })
      .where(
        and(
          sql`(${members.membershipEnd}::date + '7 days'::interval)::date < ${todayStr}::date`,
          eq(members.status, "activo")
        )
      );

    // Reactivar a quienes aún están dentro del plazo (pagaron retroactivo)
    await db.update(members)
      .set({ status: "activo", paid: true })
      .where(
        and(
          sql`(${members.membershipEnd}::date + '7 days'::interval)::date >= ${todayStr}::date`,
          eq(members.status, "mora")
        )
      );
    // ────────────────────────────────────────────────────────────────────

    // Fechas de referencia: membershipEnd = today+7 o today+1 (antes de vencer),
    // today-7 (último día de gracia, mañana entra en mora) y today-8 (hoy entró en mora)
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    const in1Day = new Date(today);
    in1Day.setDate(today.getDate() + 1);
    const graceEnds = new Date(today);
    graceEnds.setDate(today.getDate() - 7);
    const moraStarted = new Date(today);
    moraStarted.setDate(today.getDate() - 8);

    const in7Str = in7Days.toISOString().split("T")[0];
    const in1Str = in1Day.toISOString().split("T")[0];
    const graceEndsStr = graceEnds.toISOString().split("T")[0];
    const moraStartedStr = moraStarted.toISOString().split("T")[0];

    // Miembros cuya membresía vence en exactamente 7 días
    const expiring7 = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(
        and(
          sql`DATE(${members.membershipEnd}) = ${in7Str}`,
          inArray(members.status, ["activo", "mora"])
        )
      );

    // Miembros cuya membresía vence mañana
    const expiring1 = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(
        and(
          sql`DATE(${members.membershipEnd}) = ${in1Str}`,
          inArray(members.status, ["activo", "mora"])
        )
      );

    // Miembros en su último día de gracia (mañana entran en mora)
    const graceEnding = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(
        and(
          sql`DATE(${members.membershipEnd}) = ${graceEndsStr}`,
          inArray(members.status, ["activo", "mora"])
        )
      );

    // Miembros que hoy entraron en mora
    const enteredMora = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(
        and(
          sql`DATE(${members.membershipEnd}) = ${moraStartedStr}`,
          inArray(members.status, ["activo", "mora"])
        )
      );

    let sent = 0;

    async function notifyGroup(
      memberList: { id: string; name: string }[],
      title: string,
      body: string,
      type: string
    ) {
      for (const m of memberList) {
        const firstName = m.name.split(" ")[0];
        const personalTitle = title.replace("{nombre}", firstName);
        const personalBody = body.replace("{nombre}", firstName);

        // Guardar en inbox
        await db.insert(memberNotifications).values({
          memberId: m.id,
          title: personalTitle,
          body: personalBody,
          type,
          read: false,
        });

        // Push si tiene token
        const [sub] = await db
          .select({ expoPushToken: pushSubscriptions.expoPushToken })
          .from(pushSubscriptions)
          .where(
            and(
              eq(pushSubscriptions.memberId, m.id),
              eq(pushSubscriptions.active, true)
            )
          )
          .limit(1);

        if (sub?.expoPushToken) {
          await sendExpoPush(
            [sub.expoPushToken],
            personalTitle,
            personalBody,
            { type }
          );
          sent++;
        }
      }
    }

    await notifyGroup(
      expiring7,
      "⚠️ Tu membresía vence en 7 días",
      "Hola {nombre}, tu membresía de Aquarius Gym vence en 7 días. ¡Renueva a tiempo para no perder tu cupo!",
      "payment_reminder"
    );

    await notifyGroup(
      expiring1,
      "🚨 Tu membresía vence mañana",
      "Hola {nombre}, tu membresía de Aquarius Gym vence mañana. Renueva hoy para seguir entrenando sin interrupciones.",
      "payment_reminder"
    );

    await notifyGroup(
      graceEnding,
      "⏳ Último día antes de entrar en mora",
      "Hola {nombre}, hoy es tu último día de gracia. Si no renuevas hoy, mañana tu membresía de Aquarius Gym entrará en mora.",
      "payment_reminder"
    );

    await notifyGroup(
      enteredMora,
      "🔴 Tu membresía entró en mora",
      "Hola {nombre}, tu membresía de Aquarius Gym entró en mora. Pasa a tu sede a renovarla para seguir entrenando.",
      "payment_reminder"
    );

    console.log(
      `[membership-reminders] 7d: ${expiring7.length}, 1d: ${expiring1.length}, gracia: ${graceEnding.length}, mora: ${enteredMora.length}, pushes enviados: ${sent}`
    );

    return NextResponse.json({
      expiring7: expiring7.length,
      expiring1: expiring1.length,
      graceEnding: graceEnding.length,
      enteredMora: enteredMora.length,
      sent,
    });
  } catch (error) {
    console.error("[membership-reminders]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
