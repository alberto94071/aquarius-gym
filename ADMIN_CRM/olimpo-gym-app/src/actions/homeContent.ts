"use server";

import { db } from "@/db";
import { homeContent, systemUsers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getHomeContent() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  return db
    .select()
    .from(homeContent)
    .orderBy(homeContent.sortOrder, desc(homeContent.createdAt));
}

export async function createHomeContent(data: {
  type: "video" | "article" | "tip" | "image" | "notice";
  title: string;
  body?: string;
  url?: string;
  imageUrl?: string;
  sortOrder?: number;
  pinned?: boolean;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db
    .select()
    .from(systemUsers)
    .where(eq(systemUsers.email, session.user.email!));

  await db.insert(homeContent).values({
    gymId: currentUser.gymId ?? null,
    type: data.type,
    title: data.title,
    body: data.body || null,
    url: data.url || null,
    imageUrl: data.imageUrl || null,
    sortOrder: data.sortOrder ?? 0,
    pinned: data.pinned ?? false,
    published: true,
    createdBy: currentUser.id,
  });

  revalidatePath("/content");
  return { success: true };
}

export async function updateHomeContent(id: string, data: {
  type?: "video" | "article" | "tip" | "image" | "notice";
  title?: string;
  body?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  pinned?: boolean;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await db.update(homeContent).set(data).where(eq(homeContent.id, id));
  revalidatePath("/content");
  return { success: true };
}

export async function deleteHomeContent(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await db.delete(homeContent).where(eq(homeContent.id, id));
  revalidatePath("/content");
  return { success: true };
}

export async function toggleHomeContentPublished(id: string, published: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await db.update(homeContent).set({ published }).where(eq(homeContent.id, id));
  revalidatePath("/content");
  return { success: true };
}

export async function toggleHomeContentPinned(id: string, pinned: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await db.update(homeContent).set({ pinned }).where(eq(homeContent.id, id));
  revalidatePath("/content");
  return { success: true };
}
