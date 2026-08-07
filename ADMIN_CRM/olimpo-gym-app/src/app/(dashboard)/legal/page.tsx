import { db } from "@/db";
import { systemUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTermsForEditing } from "@/actions/legal";
import { LegalTermsForm } from "@/components/legal/LegalTermsForm";
import { FileText } from "lucide-react";

export default async function LegalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  if (currentUser.role !== "admin") redirect("/dashboard");

  const current = await getTermsForEditing();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-olimpo-gold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Términos de Uso y Consentimiento de Riesgo
        </h2>
        <p className="text-sm sm:text-base text-olimpo-text-muted mt-1">
          Este es el documento que cada miembro debe leer y aceptar antes de usar la app. Al publicar una versión nueva,
          se le pedirá a TODOS los miembros que la vuelvan a aceptar en su próximo inicio de sesión.
        </p>
        <p className="text-xs text-olimpo-red mt-2">
          ⚠️ Este documento es una plantilla de referencia, no asesoría legal. Antes de confiar en él ante una disputa
          real, pide a un abogado guatemalteco que lo revise y adapte a tu negocio.
        </p>
      </div>

      <div className="max-w-4xl">
        <LegalTermsForm
          currentVersion={current?.version ?? null}
          currentTitle={current?.title ?? "Consentimiento Informado y Términos de Uso"}
          currentContentHtml={current?.contentHtml ?? ""}
        />
      </div>
    </div>
  );
}
