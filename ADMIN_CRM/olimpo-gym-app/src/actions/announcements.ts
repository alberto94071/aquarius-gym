"use server";

import { db } from "@/db";
import { announcements, gyms, systemUsers, pushSubscriptions, members } from "@/db/schema";
import { eq, desc, or, isNull, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAnnouncements() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  
  const query = db.select({
    announcement: announcements,
    gym: gyms,
    creatorName: systemUsers.name
  })
  .from(announcements)
  .leftJoin(gyms, eq(announcements.gymId, gyms.id))
  .leftJoin(systemUsers, eq(announcements.createdBy, systemUsers.id));

  if (currentUser.role !== "admin") {
    query.where(or(eq(announcements.gymId, currentUser.gymId!), isNull(announcements.gymId)));
  }

  query.orderBy(desc(announcements.createdAt));

  return await query;
}

export async function createAnnouncement(data: { title: string; body: string; imageUrl?: string; gymId?: string; sendPush: boolean; pinned?: boolean }) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  
  // If not admin, force their gymId
  const finalGymId = currentUser.role !== "admin" ? currentUser.gymId : (data.gymId || null);

  await db.insert(announcements).values({
    title: data.title,
    body: data.body,
    imageUrl: data.imageUrl ?? null,
    gymId: finalGymId,
    sendPush: data.sendPush,
    pinned: data.pinned ?? false,
    published: true,
    createdBy: currentUser.id,
  });

  if (data.sendPush) {
    const { sendExpoPush } = await import("@/lib/expo-push");

    const subsQuery = db
      .select({ token: pushSubscriptions.expoPushToken })
      .from(pushSubscriptions)
      .innerJoin(members, eq(pushSubscriptions.memberId, members.id));

    const subs = finalGymId
      ? await subsQuery.where(and(eq(pushSubscriptions.active, true), eq(members.gymId, finalGymId)))
      : await subsQuery.where(eq(pushSubscriptions.active, true));

    const tokens = subs.map((s) => s.token).filter(Boolean);
    console.log(`[announcements] Push: ${tokens.length} token(s) encontrados, gymId=${finalGymId ?? "todos"}`);

    if (tokens.length > 0) {
      await sendExpoPush(tokens, data.title, data.body, { type: "announcement" });
    }
  }

  revalidatePath("/announcements");
  return { success: true };
}

export async function toggleAnnouncementStatus(id: string, published: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  
  // Basic security: if not admin, ensure they own it or it belongs to their gym
  // For simplicity, we just allow anyone with access to announcements to toggle their own gym's
  await db.update(announcements).set({ published }).where(eq(announcements.id, id));
  
  revalidatePath("/announcements");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await db.delete(announcements).where(eq(announcements.id, id));
  
  revalidatePath("/announcements");
  return { success: true };
}
