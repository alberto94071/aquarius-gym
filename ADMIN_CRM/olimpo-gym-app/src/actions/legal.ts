"use server";

import { db } from "@/db";
import { legalDocuments, systemUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getCurrentTerms } from "@/lib/legal";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autorizado");
  const [user] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email));
  if (!user || user.role !== "admin") throw new Error("Solo el administrador puede editar los términos legales");
  return user;
}

export async function getTermsForEditing() {
  await requireAdmin();
  return getCurrentTerms();
}

/**
 * Publica una versión NUEVA del documento (nunca edita la anterior — así
 * queda el historial exacto de qué texto aceptó cada miembro).
 * Esto obliga a todos los miembros a re-aceptar en su próximo login.
 */
export async function publishTerms(data: { title: string; contentHtml: string }) {
  const user = await requireAdmin();
  if (!data.title.trim() || !data.contentHtml.trim()) {
    throw new Error("El título y el contenido son obligatorios");
  }

  const current = await getCurrentTerms();
  const nextVersion = (current?.version ?? 0) + 1;

  await db.insert(legalDocuments).values({
    version: nextVersion,
    title: data.title,
    contentHtml: data.contentHtml,
    publishedBy: user.id,
  });

  revalidatePath("/legal");
  return { success: true, version: nextVersion };
}
