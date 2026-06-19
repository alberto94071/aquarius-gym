import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { homeContent, members } from "@/db/schema";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import { getMobileAuth } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getMobileAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Get member's gymId
    const [member] = await db
      .select({ gymId: members.gymId })
      .from(members)
      .where(eq(members.id, auth.memberId))
      .limit(1);

    if (!member) return NextResponse.json({ content: [] });

    // Get published content for this gym or global (gymId = null)
    const items = await db
      .select()
      .from(homeContent)
      .where(
        and(
          eq(homeContent.published, true),
          or(
            member.gymId ? eq(homeContent.gymId, member.gymId) : undefined,
            isNull(homeContent.gymId)
          )
        )
      )
      .orderBy(desc(homeContent.pinned), homeContent.sortOrder, homeContent.createdAt);

    return NextResponse.json({ content: items });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
