import { db } from "@/db";
import { legalDocuments, members } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/** Última versión publicada de los Términos de Uso (null si nunca se ha publicado). */
export async function getCurrentTerms() {
  const [row] = await db
    .select()
    .from(legalDocuments)
    .orderBy(desc(legalDocuments.version))
    .limit(1);
  return row ?? null;
}

/** ¿El miembro necesita (re)aceptar los términos vigentes? */
export async function needsTermsAcceptance(memberId: string): Promise<{
  needsAcceptance: boolean;
  currentVersion: number | null;
}> {
  const current = await getCurrentTerms();
  if (!current) return { needsAcceptance: false, currentVersion: null };

  const [member] = await db
    .select({ termsAcceptedVersion: members.termsAcceptedVersion })
    .from(members)
    .where(eq(members.id, memberId));

  const accepted = member?.termsAcceptedVersion ?? 0;
  return { needsAcceptance: accepted < current.version, currentVersion: current.version };
}
