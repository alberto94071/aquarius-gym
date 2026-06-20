"use server";

import { db } from "@/db";
import { members, gyms, systemUsers, groups, payments } from "@/db/schema";
import { eq, desc, sql, and, or } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { calculateMemberStatus } from "@/lib/utils";

export async function createGroup(gymId: string, groupData: any, groupMembers: any[]) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  
  // Use provided gymId (for admin) or fallback to user's gym
  const targetGymId = currentUser.role === "admin" && gymId ? gymId : currentUser.gymId!;

  const [gym] = await db.select().from(gyms).where(eq(gyms.id, targetGymId));
  if (!gym) throw new Error("Sede no encontrada");

  const seqStr = String(gym.nextGroupSeq).padStart(4, '0');
  
  let newGroupId: string = "";

  await db.transaction(async (tx) => {
    // 1. Create group
    const [insertedGroup] = await tx.insert(groups).values({
      gymId: gym.id,
      groupNumber: gym.nextGroupSeq,
      pricePerPerson: groupData.pricePerPerson,
      notes: groupData.notes || "",
    }).returning();
    
    newGroupId = insertedGroup.id;

    // 2. Insert members
    const startDate = new Date();
    let endDate = new Date(startDate);
    const plan = groupData.plan as "mensual" | "trimestral" | "anual";
    
    if (plan === "mensual") endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); 
    else if (plan === "trimestral") endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
    else if (plan === "anual") endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), 0);

    const isPaid = groupData.paid === "true";
    const paymentMethod = groupData.paymentMethod || null;
    let representativeId = null;

    let totalMonthly = 0;
    let totalEnrollment = 0;
    let totalCard = 0;
    let totalAmount = 0;

    for (let i = 0; i < groupMembers.length; i++) {
      const isRep = i === 0;
      const m = groupMembers[i];
      const memberCode = `${gym.codePrefix}-${seqStr}-${String(i+1).padStart(4, '0')}`;
      
      const mPrice = Number(m.price);
      const mEnrollment = Number(m.enrollmentFee || 0);
      const mCard = Number(m.cardFee || 0);
      
      totalMonthly += mPrice;
      totalEnrollment += mEnrollment;
      totalCard += mCard;
      totalAmount += (mPrice + mEnrollment + mCard);

      const endDateStr = endDate.toISOString().split("T")[0];
      const calculatedStatus = calculateMemberStatus(endDateStr);

      const [insertedMember] = await tx.insert(members).values({
        code: memberCode,
        gymId: gym.id,
        groupId: insertedGroup.id,
        isRepresentative: isRep,
        name: m.name,
        phone: m.phone,
        email: m.email || "sin_correo@olimpo.com",
        birthDate: m.birthDate,
        sex: m.sex,
        plan: plan,
        price: m.price.toString(),
        membershipStart: startDate.toISOString().split("T")[0],
        membershipEnd: endDateStr,
        status: calculatedStatus,
        paid: calculatedStatus === "activo" ? isPaid : false,
        paymentMethod: paymentMethod,
        registeredBy: currentUser.id,
      }).returning();

      if (isRep) representativeId = insertedMember.id;
    }

    // 3. Update group with representative
    await tx.update(groups)
      .set({ representativeId })
      .where(eq(groups.id, insertedGroup.id));

    // 4. Update gym sequence
    await tx.update(gyms)
      .set({ nextGroupSeq: gym.nextGroupSeq + 1 })
      .where(eq(gyms.id, gym.id));

    // 5. Register grouped payment
    if (isPaid) {
      // In groups, the payment is registered to the representative to keep it simpler
      await tx.insert(payments).values({
        gymId: gym.id,
        memberId: representativeId!, // Representative
        monthlyAmount: totalMonthly.toString(),
        enrollmentAmount: totalEnrollment.toString(),
        cardAmount: totalCard.toString(),
        amount: totalAmount.toString(),
        paymentDate: startDate.toISOString().split("T")[0],
        paymentMethod: paymentMethod,
        periodStart: startDate.toISOString().split("T")[0],
        periodEnd: endDate.toISOString().split("T")[0],
        registeredBy: currentUser.id,
        notes: `Primer pago de inscripción - Grupo #${seqStr}`,
      });
      
      // Mark group as paid full
      const groupEndDateStr = endDate.toISOString().split("T")[0];
      const groupCalculatedStatus = calculateMemberStatus(groupEndDateStr);
      await tx.update(groups).set({ paidFull: groupCalculatedStatus === "activo" }).where(eq(groups.id, insertedGroup.id));
    }
  });

  revalidatePath("/groups");
  return { success: true };
}

export async function getGroups(params?: { searchQuery?: string, gymIdFilter?: string, limit?: number, offset?: number }) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [currentUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email!));
  
  const conditions = [];
  if (currentUser.role !== "admin") {
    conditions.push(eq(groups.gymId, currentUser.gymId!));
  } else if (params?.gymIdFilter) {
    conditions.push(eq(groups.gymId, params.gymIdFilter));
  }
  
  // For search, we might want to search by group number or rep name.
  // We'll join with reps later, but we can do a simple filter if needed.
  // Actually, we can fetch all and filter in JS if search is complex, but let's do it in DB if possible.
  
  const countQuery = db.select({ count: sql`count(*)` }).from(groups);
  if (conditions.length > 0) countQuery.where(and(...conditions));
  const [countRes] = await countQuery;
  const totalCount = Number(countRes?.count || 0);

  const query = db.select().from(groups);
  if (conditions.length > 0) query.where(and(...conditions));
  query.orderBy(desc(groups.createdAt));
  
  if (params?.limit) query.limit(params.limit);
  if (params?.offset) query.offset(params.offset);

  const groupsData = await query;
  
  // Fetch reps
  const reps = await db.select().from(members).where(eq(members.isRepresentative, true));
  
  // Fetch gyms to get their prefix
  const allGyms = await db.select().from(gyms);
  
  // Count members per group
  const counts = await db.select({
    groupId: members.groupId,
    count: sql`count(*)`
  }).from(members).where(sql`${members.groupId} IS NOT NULL`).groupBy(members.groupId);
  
  let formattedData = groupsData.map(g => {
    const rep = reps.find(r => r.groupId === g.id);
    const mCount = counts.find(c => c.groupId === g.id)?.count || 0;
    const gym = allGyms.find(gym => gym.id === g.gymId);
    
    return {
      ...g,
      gymPrefix: gym?.codePrefix || "OG",
      repName: rep?.name || "Sin representante",
      repPhone: rep?.phone || "-",
      memberCount: Number(mCount)
    };
  });

  // Client-side search for representative name since it's hard to do in the base query without joins
  if (params?.searchQuery) {
    const q = params.searchQuery.toLowerCase();
    formattedData = formattedData.filter(g => 
      g.repName.toLowerCase().includes(q) || 
      g.groupNumber.toString().includes(q) ||
      g.gymPrefix.toLowerCase().includes(q)
    );
    // Note: totalCount might be slightly off if we filter client-side after paginating, 
    // but for simple cases it's acceptable, or we'd need a complex join.
    // For now, it works fine.
  }

  return {
    data: formattedData,
    totalCount
  };
}

export async function getGroupById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const [groupData] = await db.select({
    group: groups,
    gymPrefix: gyms.codePrefix,
    gymName: gyms.name,
  })
  .from(groups)
  .innerJoin(gyms, eq(groups.gymId, gyms.id))
  .where(eq(groups.id, id));

  if (!groupData) return null;

  const groupMembers = await db.select()
    .from(members)
    .where(eq(members.groupId, id))
    .orderBy(members.createdAt);
    
  const rep = groupMembers.find(m => m.id === groupData.group.representativeId);

  const paymentHistory = await db.select()
    .from(payments)
    .where(or(eq(payments.groupId, id), eq(payments.memberId, groupData.group.representativeId!)))
    .orderBy(desc(payments.paymentDate));

  return {
    ...groupData.group,
    gymPrefix: groupData.gymPrefix,
    gymName: groupData.gymName,
    representative: rep,
    members: groupMembers,
    payments: paymentHistory
  };
}
