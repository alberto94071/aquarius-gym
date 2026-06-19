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
    // Regla: gracia hasta el día 8 del mes siguiente al vencimiento.
    // mora si: DATE_TRUNC('month', membershipEnd) + '1 month 7 days' < hoy

    // Marcar como "mora" a quienes superaron el plazo de gracia
    await db.update(members)
      .set({ status: "mora", paid: false })
      .where(
        and(
          sql`(DATE_TRUNC('month', ${members.membershipEnd}::date) + '1 month 7 days'::interval)::date < ${todayStr}::date`,
          eq(members.status, "activo")
        )
      );

    // Reactivar a quienes aún están dentro del plazo (pagaron retroactivo)
    await db.update(members)
      .set({ status: "activo", paid: true })
      .where(
        and(
          sql`(DATE_TRUNC('month', ${members.membershipEnd}::date) + '1 month 7 days'::interval)::date >= ${todayStr}::date`,
          eq(members.status, "mora")
        )
      );
    // ────────────────────────────────────────────────────────────────────

    // Fechas de referencia: membershipEnd = today+7 o today+1
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    const in1Day = new Date(today);
    in1Day.setDate(today.getDate() + 1);

    const in7Str = in7Days.toISOString().split("T")[0];
    const in1Str = in1Day.toISOString().split("T")[0];

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
      "Hola {nombre}, tu membresía de Olimpo Gym vence en 7 días. ¡Renueva a tiempo para no perder tu cupo!",
      "payment_reminder"
    );

    await notifyGroup(
      expiring1,
      "🚨 Tu membresía vence mañana",
      "Hola {nombre}, tu membresía de Olimpo Gym vence mañana. Renueva hoy para seguir entrenando sin interrupciones.",
      "payment_reminder"
    );

    console.log(
      `[membership-reminders] 7d: ${expiring7.length}, 1d: ${expiring1.length}, pushes enviados: ${sent}`
    );

    return NextResponse.json({
      expiring7: expiring7.length,
      expiring1: expiring1.length,
      sent,
    });
  } catch (error) {
    console.error("[membership-reminders]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
