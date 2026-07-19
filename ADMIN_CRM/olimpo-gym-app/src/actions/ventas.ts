"use server";

import { db } from "@/db";
import { products, sales, salePayments, shiftClosures, systemUsers, members, gyms, dayPasses, attendances, payments } from "@/db/schema";
import { eq, and, desc, gte, lt, sql, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  CLOSURE_WARNING_MINUTES, DEFAULT_SHIFT_HOURS, todayInGuatemala, minutesToShiftEnd,
  shiftEndHour, gymHours, nowInGuatemala, type Shift, type GymShiftHours,
} from "@/lib/shifts";
import { sendClosureEmail } from "@/lib/email";

async function getHoursForGym(gymId: string | null): Promise<GymShiftHours> {
  if (!gymId) return DEFAULT_SHIFT_HOURS;
  const [gym] = await db.select().from(gyms).where(eq(gyms.id, gymId));
  return gym ? gymHours(gym) : DEFAULT_SHIFT_HOURS;
}

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autorizado");
  const [user] = await db.select().from(systemUsers).where(eq(systemUsers.email, session.user.email));
  if (!user || !user.active) throw new Error("No autorizado");
  return user;
}

const isAdmin = (u: { role: string }) => u.role === "admin";

/** Rango UTC del día actual de Guatemala (para filtrar timestamps) */
function todayUtcRange(): { start: Date; end: Date } {
  const today = todayInGuatemala();
  const start = new Date(`${today}T00:00:00-06:00`);
  const end = new Date(start.getTime() + 24 * 3600_000);
  return { start, end };
}

// ─── Productos ───────────────────────────────────────────────────────────────

export async function listProducts(gymFilter?: string) {
  const user = await getCurrentUser();
  const gymId = isAdmin(user) ? gymFilter : user.gymId!;
  const conditions = [eq(products.active, true)];
  if (gymId) conditions.push(eq(products.gymId, gymId));
  return db.select().from(products).where(and(...conditions)).orderBy(products.name);
}

export async function createProduct(data: {
  gymId: string;
  name: string;
  category?: string;
  costPrice: string;
  salePrice: string;
  stock: number;
  imageUrl?: string;
}) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) throw new Error("Solo el administrador puede crear productos");
  await db.insert(products).values({
    gymId: data.gymId,
    name: data.name,
    category: data.category || null,
    costPrice: data.costPrice,
    salePrice: data.salePrice,
    stock: data.stock,
    imageUrl: data.imageUrl || null,
  });
  revalidatePath("/ventas");
  return { success: true };
}

export async function updateProduct(
  productId: string,
  data: { name?: string; category?: string; costPrice?: string; salePrice?: string; stock?: number; active?: boolean }
) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) throw new Error("Solo el administrador puede modificar productos y precios");
  await db.update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, productId));
  revalidatePath("/ventas");
  return { success: true };
}

// ─── Ventas ──────────────────────────────────────────────────────────────────

function currentShiftByTime(hours: GymShiftHours): Shift {
  return minutesToShiftEnd("am", hours) > 0 ? "am" : "pm";
}

export async function registerSale(data: {
  productId: string;
  quantity: number;
  memberId?: string | null;
  amountPaid: string; // lo que pagó ahora (puede ser 0 o parcial)
  status: "pagada" | "credito" | "apartado";
  notes?: string;
}) {
  const user = await getCurrentUser();
  const [product] = await db.select().from(products).where(eq(products.id, data.productId));
  if (!product || !product.active) throw new Error("Producto no encontrado");
  if (!isAdmin(user) && product.gymId !== user.gymId) throw new Error("Producto de otra sede");
  if (product.stock < data.quantity) throw new Error(`Stock insuficiente: quedan ${product.stock}`);

  const total = (Number(product.salePrice) * data.quantity).toFixed(2);
  const paid = Number(data.amountPaid || 0);
  if (paid > Number(total)) throw new Error("El pago no puede ser mayor al total");
  // Crédito y apartado requieren un miembro que responda por la deuda
  if (data.status !== "pagada" && !data.memberId) throw new Error("Las ventas a crédito/apartado requieren un miembro");
  if (data.status === "pagada" && paid < Number(total)) throw new Error("Una venta pagada debe cubrir el total");

  const shift: Shift = user.shift ?? currentShiftByTime(await getHoursForGym(product.gymId));

  await db.transaction(async (tx) => {
    const [sale] = await tx.insert(sales).values({
      gymId: product.gymId,
      productId: product.id,
      memberId: data.memberId || null,
      quantity: data.quantity,
      unitPrice: product.salePrice,
      total,
      amountPaid: paid.toFixed(2),
      status: data.status,
      shift,
      soldBy: user.id,
      notes: data.notes || null,
    }).returning();

    if (paid > 0) {
      await tx.insert(salePayments).values({
        saleId: sale.id,
        amount: paid.toFixed(2),
        registeredBy: user.id,
      });
    }

    await tx.update(products)
      .set({ stock: product.stock - data.quantity, updatedAt: new Date() })
      .where(eq(products.id, product.id));
  });

  revalidatePath("/ventas");
  return { success: true };
}

/** Abono a una venta a crédito/apartado. Si completa el total, queda pagada. */
export async function registerSaleAbono(saleId: string, amount: string, notes?: string) {
  const user = await getCurrentUser();
  const [sale] = await db.select().from(sales).where(eq(sales.id, saleId));
  if (!sale) throw new Error("Venta no encontrada");
  if (!isAdmin(user) && sale.gymId !== user.gymId) throw new Error("Venta de otra sede");
  if (sale.status === "pagada" || sale.status === "cancelada") throw new Error("Esta venta no admite abonos");

  const abono = Number(amount);
  if (!abono || abono <= 0) throw new Error("Monto inválido");
  const newPaid = Number(sale.amountPaid) + abono;
  if (newPaid > Number(sale.total) + 0.001) {
    throw new Error(`El abono excede el saldo. Saldo pendiente: Q${(Number(sale.total) - Number(sale.amountPaid)).toFixed(2)}`);
  }

  await db.transaction(async (tx) => {
    await tx.insert(salePayments).values({
      saleId,
      amount: abono.toFixed(2),
      registeredBy: user.id,
      notes: notes || null,
    });
    await tx.update(sales)
      .set({
        amountPaid: newPaid.toFixed(2),
        status: newPaid >= Number(sale.total) - 0.001 ? "pagada" : sale.status,
      })
      .where(eq(sales.id, saleId));
  });

  revalidatePath("/ventas");
  return { success: true };
}

export async function cancelSale(saleId: string) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) throw new Error("Solo el administrador puede cancelar ventas");
  const [sale] = await db.select().from(sales).where(eq(sales.id, saleId));
  if (!sale || sale.status === "cancelada") throw new Error("Venta no encontrada");
  await db.transaction(async (tx) => {
    await tx.update(sales).set({ status: "cancelada" }).where(eq(sales.id, saleId));
    await tx.update(products)
      .set({ stock: sql`${products.stock} + ${sale.quantity}` })
      .where(eq(products.id, sale.productId));
  });
  revalidatePath("/ventas");
  return { success: true };
}

/**
 * Lista de ventas con aislamiento por turno:
 * - Admin: todas (filtro opcional por sede).
 * - Secretaria: SOLO las ventas de su sede, de su turno y del día de hoy.
 */
export async function listSales(gymFilter?: string) {
  const user = await getCurrentUser();
  const conditions = [];

  if (isAdmin(user)) {
    if (gymFilter) conditions.push(eq(sales.gymId, gymFilter));
  } else {
    const { start, end } = todayUtcRange();
    conditions.push(eq(sales.gymId, user.gymId!));
    if (user.shift) conditions.push(eq(sales.shift, user.shift));
    conditions.push(gte(sales.saleDate, start));
    conditions.push(lt(sales.saleDate, end));
  }

  return db
    .select({
      id: sales.id,
      quantity: sales.quantity,
      unitPrice: sales.unitPrice,
      total: sales.total,
      amountPaid: sales.amountPaid,
      status: sales.status,
      shift: sales.shift,
      saleDate: sales.saleDate,
      notes: sales.notes,
      productName: products.name,
      memberName: members.name,
      memberCode: members.code,
    })
    .from(sales)
    .innerJoin(products, eq(sales.productId, products.id))
    .leftJoin(members, eq(sales.memberId, members.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(sales.saleDate))
    .limit(200);
}

/** Resumen financiero — SOLO admin (ingresos, costo y ganancia) */
export async function getSalesSummary(gymFilter?: string) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) throw new Error("Solo el administrador puede ver el resumen financiero");

  const conditions = [inArray(sales.status, ["pagada", "credito", "apartado"])];
  if (gymFilter) conditions.push(eq(sales.gymId, gymFilter));

  const [row] = await db
    .select({
      totalVendido: sql<string>`COALESCE(SUM(${sales.total}), 0)`,
      totalCobrado: sql<string>`COALESCE(SUM(${sales.amountPaid}), 0)`,
      totalCosto: sql<string>`COALESCE(SUM(${products.costPrice} * ${sales.quantity}), 0)`,
      numVentas: sql<number>`COUNT(*)::int`,
    })
    .from(sales)
    .innerJoin(products, eq(sales.productId, products.id))
    .where(and(...conditions));

  const totalVendido = Number(row?.totalVendido ?? 0);
  const totalCobrado = Number(row?.totalCobrado ?? 0);
  const totalCosto = Number(row?.totalCosto ?? 0);

  return {
    totalVendido,
    totalCobrado,
    porCobrar: totalVendido - totalCobrado,
    totalCosto,
    ganancia: totalVendido - totalCosto,
    numVentas: row?.numVentas ?? 0,
  };
}

// ─── Pago por día ────────────────────────────────────────────────────────────

/** Cobra un día de gimnasio a un visitante sin membresía (precio de la sede) */
export async function registerDayPass(data: { personName?: string; gymId?: string }) {
  const user = await getCurrentUser();
  const gymId = isAdmin(user) ? (data.gymId ?? user.gymId) : user.gymId;
  if (!gymId) throw new Error("Selecciona una sede");

  const [gym] = await db.select().from(gyms).where(eq(gyms.id, gymId));
  if (!gym) throw new Error("Sede no encontrada");

  const shift: Shift = user.shift ?? currentShiftByTime(gymHours(gym));

  await db.insert(dayPasses).values({
    gymId,
    personName: data.personName || null,
    amount: gym.pricingDayPass,
    shift,
    soldBy: user.id,
  });

  revalidatePath("/ventas");
  return { success: true, amount: gym.pricingDayPass };
}

/** Pagos por día de hoy (secretaria: solo su turno; admin: todos) */
export async function listTodayDayPasses(gymFilter?: string) {
  const user = await getCurrentUser();
  const { start, end } = todayUtcRange();
  const conditions = [gte(dayPasses.createdAt, start), lt(dayPasses.createdAt, end)];
  if (isAdmin(user)) {
    if (gymFilter) conditions.push(eq(dayPasses.gymId, gymFilter));
  } else {
    conditions.push(eq(dayPasses.gymId, user.gymId!));
    if (user.shift) conditions.push(eq(dayPasses.shift, user.shift));
  }
  const rows = await db.select().from(dayPasses).where(and(...conditions)).orderBy(desc(dayPasses.createdAt));
  return { items: rows, total: rows.reduce((s, r) => s + Number(r.amount), 0) };
}

// ─── Cuadre de turno ─────────────────────────────────────────────────────────

/**
 * Estado del turno de hoy para la secretaria: crea el registro si no existe,
 * y calcula recordatorios/vencimiento del cuadre.
 */
export async function getMyShiftStatus() {
  const user = await getCurrentUser();
  if (isAdmin(user) || !user.gymId || !user.shift) return null;

  const hours = await getHoursForGym(user.gymId);
  const today = todayInGuatemala();
  let [closure] = await db.select().from(shiftClosures).where(and(
    eq(shiftClosures.gymId, user.gymId),
    eq(shiftClosures.userId, user.id),
    eq(shiftClosures.closureDate, today),
    eq(shiftClosures.shift, user.shift)
  ));

  if (!closure) {
    [closure] = await db.insert(shiftClosures).values({
      gymId: user.gymId,
      userId: user.id,
      shift: user.shift,
      closureDate: today,
    }).onConflictDoNothing().returning();
    if (!closure) {
      [closure] = await db.select().from(shiftClosures).where(and(
        eq(shiftClosures.gymId, user.gymId),
        eq(shiftClosures.userId, user.id),
        eq(shiftClosures.closureDate, today),
        eq(shiftClosures.shift, user.shift)
      ));
    }
  }

  const minutesLeft = minutesToShiftEnd(user.shift, hours);

  // Si el turno ya terminó y no cerró → marcar como perdido
  if (closure.status === "abierto" && minutesLeft < 0) {
    await db.update(shiftClosures).set({ status: "perdido" }).where(eq(shiftClosures.id, closure.id));
    closure = { ...closure, status: "perdido" };
  }

  // Inventario actual de la sede (para confirmar al abrir y cuadrar al cerrar)
  const inventory = await db
    .select({ id: products.id, name: products.name, stock: products.stock })
    .from(products)
    .where(and(eq(products.gymId, user.gymId), eq(products.active, true)))
    .orderBy(products.name);

  return {
    closure,
    inventory,
    shift: user.shift,
    shiftEnd: shiftEndHour(user.shift, hours),
    minutesLeft,
    shouldWarn: closure.status === "abierto" && minutesLeft <= CLOSURE_WARNING_MINUTES && minutesLeft > 0,
  };
}

/** La secretaria confirma que el inventario físico coincide al iniciar su turno */
export async function confirmShiftOpening() {
  const user = await getCurrentUser();
  if (!user.shift || !user.gymId) throw new Error("Usuario sin turno asignado");
  const today = todayInGuatemala();
  await db.update(shiftClosures)
    .set({ openingConfirmedAt: new Date() })
    .where(and(
      eq(shiftClosures.gymId, user.gymId),
      eq(shiftClosures.userId, user.id),
      eq(shiftClosures.closureDate, today),
      eq(shiftClosures.shift, user.shift)
    ));
  revalidatePath("/ventas");
  return { success: true };
}

/** Cierre de turno: registra el cuadre. Después de la hora límite ya no se acepta. */
export async function submitShiftClosure(data: {
  countedCash: string;
  stockOk: boolean;
  discrepancies?: string; // faltantes: los repone la secretaria
  notes?: string;
}) {
  const user = await getCurrentUser();
  if (!user.shift || !user.gymId) throw new Error("Usuario sin turno asignado");

  const status = await getMyShiftStatus();
  if (!status) throw new Error("Sin turno activo");
  if (status.closure.status === "perdido") {
    return {
      success: false,
      error: "PERDIDO",
      message: "⏰ El tiempo para enviar tu cuadre venció. Este cierre quedó marcado como PERDIDO — envía el cuadre a tiempo la próxima vez (30 minutos antes del fin de tu turno).",
    };
  }
  if (status.closure.status === "cerrado") {
    return { success: false, error: "YA_CERRADO", message: "Ya enviaste el cuadre de hoy." };
  }

  // Total vendido en el turno de hoy (efectivo cobrado)
  const { start, end } = todayUtcRange();
  const [tot] = await db
    .select({ cobrado: sql<string>`COALESCE(SUM(${sales.amountPaid}), 0)` })
    .from(sales)
    .where(and(
      eq(sales.gymId, user.gymId),
      eq(sales.shift, user.shift),
      gte(sales.saleDate, start),
      lt(sales.saleDate, end),
      inArray(sales.status, ["pagada", "credito", "apartado"])
    ));

  await db.update(shiftClosures)
    .set({
      closedAt: new Date(),
      status: "cerrado",
      salesTotal: tot?.cobrado ?? "0",
      countedCash: data.countedCash,
      stockOk: data.stockOk,
      discrepancies: data.discrepancies || null,
      notes: data.notes || null,
    })
    .where(eq(shiftClosures.id, status.closure.id));

  // ── Correo al dueño con el resumen completo del día/turno ──
  try {
    const today = todayInGuatemala();
    const [gym] = await db.select().from(gyms).where(eq(gyms.id, user.gymId));

    const [attendanceRow] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(attendances)
      .where(and(eq(attendances.gymId, user.gymId), gte(attendances.checkinAt, start), lt(attendances.checkinAt, end)));

    // Mensualidades registradas HOY por esta secretaria
    const membershipPayments = await db
      .select({ memberName: members.name, amount: payments.amount })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .where(and(
        eq(payments.gymId, user.gymId),
        eq(payments.registeredBy, user.id),
        eq(payments.paymentDate, today)
      ));

    const productSales = await db
      .select({ productName: products.name, quantity: sales.quantity, total: sales.total, status: sales.status })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .where(and(
        eq(sales.gymId, user.gymId),
        eq(sales.shift, user.shift),
        gte(sales.saleDate, start),
        lt(sales.saleDate, end),
        inArray(sales.status, ["pagada", "credito", "apartado"])
      ));

    const dp = await db
      .select({ amount: dayPasses.amount })
      .from(dayPasses)
      .where(and(
        eq(dayPasses.gymId, user.gymId),
        eq(dayPasses.shift, user.shift),
        gte(dayPasses.createdAt, start),
        lt(dayPasses.createdAt, end)
      ));

    await sendClosureEmail({
      gymName: gym?.name ?? "Aquarius Gym",
      shift: user.shift,
      date: today,
      secretaryName: user.name,
      attendanceCount: attendanceRow?.n ?? 0,
      membershipPayments: membershipPayments.map((p) => ({ memberName: p.memberName, amount: p.amount })),
      productSales,
      dayPasses: { count: dp.length, total: dp.reduce((s, r) => s + Number(r.amount), 0) },
      salesTotal: tot?.cobrado ?? "0",
      countedCash: data.countedCash,
      stockOk: data.stockOk,
      discrepancies: data.discrepancies,
      notes: data.notes,
    });
  } catch (e) {
    console.error("[cuadre] no se pudo enviar el correo:", e);
  }

  revalidatePath("/ventas");
  return { success: true, salesTotal: tot?.cobrado ?? "0" };
}

/** Historial de cierres — admin ve todos, secretaria solo los suyos */
export async function listShiftClosures(gymFilter?: string) {
  const user = await getCurrentUser();
  const conditions = [];
  if (isAdmin(user)) {
    if (gymFilter) conditions.push(eq(shiftClosures.gymId, gymFilter));
  } else {
    conditions.push(eq(shiftClosures.userId, user.id));
  }
  return db
    .select({
      id: shiftClosures.id,
      closureDate: shiftClosures.closureDate,
      shift: shiftClosures.shift,
      status: shiftClosures.status,
      salesTotal: shiftClosures.salesTotal,
      countedCash: shiftClosures.countedCash,
      stockOk: shiftClosures.stockOk,
      discrepancies: shiftClosures.discrepancies,
      openingConfirmedAt: shiftClosures.openingConfirmedAt,
      closedAt: shiftClosures.closedAt,
      userName: systemUsers.name,
    })
    .from(shiftClosures)
    .innerJoin(systemUsers, eq(shiftClosures.userId, systemUsers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(shiftClosures.closureDate))
    .limit(60);
}

/** Deuda de tienda de un miembro (ventas a crédito/apartado con saldo) */
export async function getMemberStoreDebt(memberId: string) {
  await getCurrentUser();
  const rows = await db
    .select({
      id: sales.id,
      total: sales.total,
      amountPaid: sales.amountPaid,
      status: sales.status,
      saleDate: sales.saleDate,
      productName: products.name,
      quantity: sales.quantity,
    })
    .from(sales)
    .innerJoin(products, eq(sales.productId, products.id))
    .where(and(eq(sales.memberId, memberId), inArray(sales.status, ["credito", "apartado"])))
    .orderBy(desc(sales.saleDate));

  const totalDebt = rows.reduce((s, r) => s + (Number(r.total) - Number(r.amountPaid)), 0);
  return { items: rows, totalDebt };
}
