import { GroupForm } from "@/components/groups/GroupForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { gyms } from "@/db/schema";

export default async function NewGroupPage() {
  const session = await auth();
  const userRole = session?.user?.role || "secretaria";
  
  let availableGyms: any[] = [];
  if (userRole === "admin") {
    availableGyms = await db.select().from(gyms);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/groups" 
          className="p-2 text-olimpo-text-muted hover:text-olimpo-gold bg-olimpo-surface rounded-lg border border-olimpo-surface-light transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-serif font-bold text-olimpo-gold">
            Crear Nuevo Grupo
          </h2>
          <p className="text-sm text-olimpo-text-muted mt-1">
            Inscribe a una familia o grupo de amigos de un solo golpe.
          </p>
        </div>
      </div>

      <GroupForm userRole={userRole} gyms={availableGyms} />
    </div>
  );
}
