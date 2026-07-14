import { MemberForm } from "@/components/members/MemberForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { gyms } from "@/db/schema";

export default async function NewMemberPage() {
  const session = await auth();
  const userRole = session?.user?.role || "secretaria";
  
  // Fetch gyms for the admin to select
  let availableGyms: any[] = [];
  if (userRole === "admin") {
    availableGyms = await db.select().from(gyms);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/members" 
          className="p-2 text-olimpo-text-muted hover:text-olimpo-gold bg-olimpo-surface rounded-lg border border-olimpo-surface-light transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-serif font-bold text-olimpo-gold">
            Nuevo Miembro
          </h2>
          <p className="text-sm text-olimpo-text-muted mt-1">
            Inscribe a una nueva persona. El carné se generará automáticamente.
          </p>
        </div>
      </div>

      <MemberForm userRole={userRole} gyms={availableGyms} />
    </div>
  );
}
