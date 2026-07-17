"use server";

import { db } from "@/db";
import { systemUsers, gyms } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getSystemUsers() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  if (currentUser.role !== "admin") throw new Error("No tienes permisos");

  const users = await db.select({
    user: systemUsers,
    gym: gyms
  })
  .from(systemUsers)
  .leftJoin(gyms, eq(systemUsers.gymId, gyms.id))
  .orderBy(desc(systemUsers.createdAt));

  return users;
}

export async function createSystemUser(data: { email: string; name: string; role: any; gymId?: string; shift?: "am" | "pm" }) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  if (currentUser.role !== "admin") throw new Error("No tienes permisos");

  await db.insert(systemUsers).values({
    email: data.email,
    name: data.name,
    role: data.role,
    gymId: data.gymId || null,
    shift: data.shift || null,
    active: true,
  });

  revalidatePath("/roles");
  return { success: true };
}

export async function toggleUserStatus(userId: string, active: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  if (currentUser.role !== "admin") throw new Error("No tienes permisos");

  await db.update(systemUsers).set({ active }).where(eq(systemUsers.id, userId));
  
  revalidatePath("/roles");
  return { success: true };
}

export async function deleteSystemUser(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  if (currentUser.role !== "admin") throw new Error("No tienes permisos");
  
  if (currentUser.id === userId) throw new Error("No puedes eliminarte a ti mismo");

  await db.delete(systemUsers).where(eq(systemUsers.id, userId));
  
  revalidatePath("/roles");
  return { success: true };
}
