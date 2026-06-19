import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, pushSubscriptions, memberNotifications } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { sendExpoPush } from "@/lib/expo-push";

// Protegido con CRON_SECRET — Vercel Cron envía GET con Authorization: Bearer {secret}
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();        // 1-31

    // Buscar miembros activos que cumplen años hoy (mismo mes y día, sin importar el año)
    const birthdayMembers = await db
      .select({
        id: members.id,
        name: members.name,
      })
      .from(members)
      .where(
        sql`EXTRACT(MONTH FROM ${members.birthDate}) = ${month}
        AND EXTRACT(DAY FROM ${members.birthDate}) = ${day}
        AND ${members.status} IN ('activo', 'mora')`
      );

    if (birthdayMembers.length === 0) {
      return NextResponse.json({ sent: 0, message: "Sin cumpleaños hoy" });
    }

    let sent = 0;

    for (const member of birthdayMembers) {
      const firstName = member.name.split(" ")[0];

      // Obtener push token del miembro
      const [sub] = await db
        .select({ expoPushToken: pushSubscriptions.expoPushToken })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.memberId, member.id))
        .limit(1);

      // Guardar notificación en la base de datos para el miembro
      await db.insert(memberNotifications).values({
        memberId: member.id,
        title: `¡Feliz cumpleaños, ${firstName}! 🎂`,
        body: `Todo el equipo de Aquarius Gym te desea un día increíble. ¡Sigue siendo grande!`,
        type: "birthday",
        read: false,
      });

      // Enviar push solo si tiene token registrado
      if (sub?.expoPushToken) {
        await sendExpoPush(
          [sub.expoPushToken],
          `¡Feliz cumpleaños, ${firstName}! 🎂`,
          `Todo el equipo de Aquarius Gym te desea un día increíble. ¡Sigue siendo grande!`,
          { type: "birthday", memberName: firstName }
        );
        sent++;
      }
    }

    console.log(`[birthday] Cumpleaños procesados: ${birthdayMembers.length}, pushes enviados: ${sent}`);
    return NextResponse.json({ processed: birthdayMembers.length, sent });
  } catch (error) {
    console.error("[birthday]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
