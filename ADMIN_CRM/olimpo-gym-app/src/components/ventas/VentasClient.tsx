"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createProduct, updateProduct, registerSale, registerSaleAbono, cancelSale,
  confirmShiftOpening, submitShiftClosure,
} from "@/actions/ventas";
import { searchMembersForPayment } from "@/actions/payments";
import {
  Package, Plus, ShoppingCart, HandCoins, AlertTriangle, CheckCircle2,
  Clock, X, Loader2, TrendingUp, Ban,
} from "lucide-react";

interface Product { id: string; name: string; category: string | null; costPrice: string; salePrice: string; stock: number; gymId: string }
interface Sale {
  id: string; quantity: number; unitPrice: string; total: string; amountPaid: string;
  status: string; shift: string | null; saleDate: Date | string; notes: string | null;
  productName: string; memberName: string | null; memberCode: string | null;
}
interface Summary { totalVendido: number; totalCobrado: number; porCobrar: number; totalCosto: number; ganancia: number; numVentas: number }
interface ShiftStatus {
  status: string; openingConfirmed: boolean; minutesLeft: number; shouldWarn: boolean;
  shiftEnd: number; shift: string; inventory: { id: string; name: string; stock: number }[];
}
interface Closure {
  id: string; closureDate: string; shift: string; status: string; salesTotal: string;
  countedCash: string | null; stockOk: boolean | null; discrepancies: string | null;
  openingConfirmedAt: Date | null; closedAt: Date | null; userName: string;
}

const Q = (n: number | string) => `Q${Number(n).toFixed(2)}`;

const STATUS_BADGE: Record<string, string> = {
  pagada: "bg-green-500/15 text-green-400 border-green-500/30",
  credito: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  apartado: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  cancelada: "bg-red-500/15 text-red-400 border-red-500/30",
};

const inputCls = "w-full bg-olimpo-bg border border-olimpo-surface-light rounded-lg px-3 py-2 text-olimpo-text focus:border-olimpo-gold focus:outline-none";
const labelCls = "block text-xs text-olimpo-text-muted mb-1 uppercase tracking-wide";

export function VentasClient({
  isAdmin, gyms, products, sales, summary, shiftStatus, closures,
}: {
  isAdmin: boolean;
  gyms: { id: string; name: string }[];
  products: Product[];
  sales: Sale[];
  summary: Summary | null;
  shiftStatus: ShiftStatus | null;
  closures: Closure[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"ventas" | "inventario" | "cuadres">("ventas");
  const [error, setError] = useState("");
  const [showProductModal, setShowProductModal] = useState<Product | "new" | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState<Sale | null>(null);
  const [showClosureModal, setShowClosureModal] = useState(false);

  // Refrescar cada minuto para que el contador del cuadre avance
  useEffect(() => {
    if (!shiftStatus || shiftStatus.status !== "abierto") return;
    const t = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(t);
  }, [shiftStatus, router]);

  const act = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Banner de apertura de turno (secretarias) ── */}
      {shiftStatus && !shiftStatus.openingConfirmed && shiftStatus.status === "abierto" && (
        <div className="p-4 rounded-2xl bg-olimpo-gold/10 border border-olimpo-gold/40 space-y-3">
          <p className="font-bold text-olimpo-gold flex items-center gap-2">
            <Package className="w-5 h-5" /> Confirma el inventario para abrir tu turno
          </p>
          <p className="text-sm text-olimpo-text-muted">
            Verifica físicamente que las existencias coincidan con el sistema. Si algo no cuadra, avísale al administrador ANTES de confirmar.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {shiftStatus.inventory.map((p) => (
              <div key={p.id} className="bg-black/30 rounded-lg px-3 py-2 text-sm flex justify-between">
                <span className="text-olimpo-text truncate mr-2">{p.name}</span>
                <span className="text-olimpo-gold font-bold">{p.stock}</span>
              </div>
            ))}
            {shiftStatus.inventory.length === 0 && <p className="text-sm text-olimpo-text-muted col-span-full">Sin productos registrados aún.</p>}
          </div>
          <button
            onClick={() => act(() => confirmShiftOpening())}
            className="px-4 py-2 rounded-lg bg-olimpo-gold text-black font-bold hover:bg-olimpo-gold/90"
          >
            ✓ Confirmo que el inventario está completo
          </button>
        </div>
      )}

      {/* ── Aviso de cuadre próximo / perdido ── */}
      {shiftStatus?.shouldWarn && shiftStatus.status === "abierto" && (
        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/50 flex items-center justify-between gap-4 animate-pulse">
          <p className="text-orange-300 font-bold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            ¡Prepara tu cuadre! Tu turno termina a las {shiftStatus.shiftEnd}:00 — quedan {shiftStatus.minutesLeft} min para enviarlo.
          </p>
          <button onClick={() => setShowClosureModal(true)} className="px-4 py-2 rounded-lg bg-orange-500 text-black font-bold whitespace-nowrap">
            Hacer cuadre ahora
          </button>
        </div>
      )}
      {shiftStatus?.status === "perdido" && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/50 text-red-400 font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          ⏰ Se venció el tiempo: el cuadre de hoy quedó PERDIDO. Envíalo a tiempo la próxima vez (antes de las {shiftStatus.shiftEnd}:00).
        </div>
      )}
      {shiftStatus?.status === "cerrado" && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/40 text-green-400 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Cuadre de hoy enviado. ¡Buen trabajo!
        </div>
      )}

      {/* ── Resumen financiero (solo admin) ── */}
      {isAdmin && summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Ventas", value: String(summary.numVentas) },
            { label: "Total vendido", value: Q(summary.totalVendido) },
            { label: "Cobrado", value: Q(summary.totalCobrado) },
            { label: "Por cobrar", value: Q(summary.porCobrar) },
            { label: "Ganancia", value: Q(summary.ganancia), gold: true },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl border p-4 ${c.gold ? "border-olimpo-gold/50 bg-olimpo-gold/10" : "border-olimpo-surface-light bg-olimpo-surface"}`}>
              <p className="text-xs text-olimpo-text-muted uppercase tracking-wide">{c.label}</p>
              <p className={`text-xl font-bold mt-1 ${c.gold ? "text-olimpo-gold" : "text-olimpo-text"}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-sm">{error}</div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 items-center flex-wrap">
        {([["ventas", "Ventas"], ["inventario", "Inventario"], ["cuadres", "Cuadres"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-bold border ${tab === k ? "bg-olimpo-gold text-black border-olimpo-gold" : "text-olimpo-text-muted border-olimpo-surface-light hover:bg-olimpo-surface-light/40"}`}>
            {l}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setShowSaleModal(true)}
          className="px-4 py-2 rounded-lg bg-olimpo-gold text-black font-bold flex items-center gap-2 hover:bg-olimpo-gold/90">
          <ShoppingCart className="w-4 h-4" /> Nueva venta
        </button>
        {isAdmin && (
          <button onClick={() => setShowProductModal("new")}
            className="px-4 py-2 rounded-lg border border-olimpo-gold/50 text-olimpo-gold font-bold flex items-center gap-2 hover:bg-olimpo-gold/10">
            <Plus className="w-4 h-4" /> Producto
          </button>
        )}
        {shiftStatus && shiftStatus.status === "abierto" && !shiftStatus.shouldWarn && (
          <button onClick={() => setShowClosureModal(true)}
            className="px-4 py-2 rounded-lg border border-olimpo-surface-light text-olimpo-text-muted font-bold hover:bg-olimpo-surface-light/40">
            Enviar cuadre
          </button>
        )}
      </div>

      {/* ── Tab: Ventas ── */}
      {tab === "ventas" && (
        <div className="rounded-2xl border border-olimpo-surface-light overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-olimpo-surface text-olimpo-text-muted text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Miembro</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3">Pagado</th>
                <th className="text-center px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const saldo = Number(s.total) - Number(s.amountPaid);
                return (
                  <tr key={s.id} className="border-t border-olimpo-surface-light/50">
                    <td className="px-4 py-3">
                      <p className="text-olimpo-text font-medium">{s.quantity}× {s.productName}</p>
                      <p className="text-xs text-olimpo-text-muted">{new Date(s.saleDate).toLocaleString("es-GT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}{s.shift ? ` · ${s.shift.toUpperCase()}` : ""}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-olimpo-text-muted">
                      {s.memberName ? `${s.memberName} (${s.memberCode})` : "Mostrador"}
                    </td>
                    <td className="px-4 py-3 text-right text-olimpo-text font-bold">{Q(s.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={saldo > 0.001 ? "text-orange-300" : "text-green-400"}>{Q(s.amountPaid)}</span>
                      {saldo > 0.001 && <p className="text-xs text-red-400">debe {Q(saldo)}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_BADGE[s.status] ?? ""}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {(s.status === "credito" || s.status === "apartado") && (
                        <button onClick={() => setShowAbonoModal(s)} title="Registrar abono"
                          className="px-2 py-1 rounded bg-olimpo-gold/15 text-olimpo-gold text-xs font-bold border border-olimpo-gold/40">
                          <HandCoins className="w-4 h-4 inline" /> Abono
                        </button>
                      )}
                      {isAdmin && s.status !== "cancelada" && (
                        <button onClick={() => { if (confirm("¿Cancelar esta venta y devolver el stock?")) act(() => cancelSale(s.id)); }}
                          title="Cancelar venta" className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs border border-red-500/30">
                          <Ban className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sales.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-olimpo-text-muted">
                  {isAdmin ? "No hay ventas registradas." : "No hay ventas en tu turno de hoy."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Inventario ── */}
      {tab === "inventario" && (
        <div className="rounded-2xl border border-olimpo-surface-light overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-olimpo-surface text-olimpo-text-muted text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Producto</th>
                {isAdmin && <th className="text-right px-4 py-3">P. compra</th>}
                <th className="text-right px-4 py-3">P. venta</th>
                {isAdmin && <th className="text-right px-4 py-3">Margen</th>}
                <th className="text-right px-4 py-3">Stock</th>
                {isAdmin && <th className="text-right px-4 py-3">Editar</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-olimpo-surface-light/50">
                  <td className="px-4 py-3">
                    <p className="text-olimpo-text font-medium">{p.name}</p>
                    {p.category && <p className="text-xs text-olimpo-text-muted">{p.category}</p>}
                  </td>
                  {isAdmin && <td className="px-4 py-3 text-right text-olimpo-text-muted">{Q(p.costPrice)}</td>}
                  <td className="px-4 py-3 text-right text-olimpo-text font-bold">{Q(p.salePrice)}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right text-green-400">
                      <TrendingUp className="w-3 h-3 inline mr-1" />{Q(Number(p.salePrice) - Number(p.costPrice))}
                    </td>
                  )}
                  <td className={`px-4 py-3 text-right font-bold ${p.stock <= 3 ? "text-red-400" : "text-olimpo-text"}`}>{p.stock}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setShowProductModal(p)} className="text-olimpo-gold text-xs font-bold hover:underline">Editar</button>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-olimpo-text-muted">
                  Sin productos. {isAdmin ? "Crea el primero con el botón + Producto." : "El administrador aún no registra productos."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Cuadres ── */}
      {tab === "cuadres" && (
        <div className="rounded-2xl border border-olimpo-surface-light overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-olimpo-surface text-olimpo-text-muted text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Secretaria</th>
                <th className="text-center px-4 py-3">Turno</th>
                <th className="text-right px-4 py-3">Vendido</th>
                <th className="text-right px-4 py-3">Contado</th>
                <th className="text-center px-4 py-3">Inventario</th>
                <th className="text-center px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {closures.map((c) => (
                <tr key={c.id} className="border-t border-olimpo-surface-light/50">
                  <td className="px-4 py-3 text-olimpo-text">{c.closureDate}</td>
                  <td className="px-4 py-3 text-olimpo-text-muted">{c.userName}</td>
                  <td className="px-4 py-3 text-center text-olimpo-text">{c.shift.toUpperCase()}</td>
                  <td className="px-4 py-3 text-right text-olimpo-text">{Q(c.salesTotal)}</td>
                  <td className="px-4 py-3 text-right text-olimpo-text">{c.countedCash != null ? Q(c.countedCash) : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {c.stockOk == null ? "—" : c.stockOk
                      ? <span className="text-green-400">✓ cuadró</span>
                      : <span className="text-red-400" title={c.discrepancies ?? ""}>✗ faltante</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      c.status === "cerrado" ? "bg-green-500/15 text-green-400 border-green-500/30"
                      : c.status === "perdido" ? "bg-red-500/15 text-red-400 border-red-500/30"
                      : "bg-olimpo-gold/15 text-olimpo-gold border-olimpo-gold/30"}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              {closures.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-olimpo-text-muted">Sin cuadres registrados aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modales ── */}
      {showProductModal && isAdmin && (
        <ProductModal
          product={showProductModal === "new" ? null : showProductModal}
          gyms={gyms}
          onClose={() => setShowProductModal(null)}
          onSave={async (payload, productId) => {
            const ok = await act(() => productId
              ? updateProduct(productId, payload)
              : createProduct(payload as Parameters<typeof createProduct>[0]));
            if (ok) setShowProductModal(null);
          }}
        />
      )}
      {showSaleModal && (
        <SaleModal
          products={products}
          onClose={() => setShowSaleModal(false)}
          onSave={async (payload) => {
            const ok = await act(() => registerSale(payload));
            if (ok) setShowSaleModal(false);
          }}
        />
      )}
      {showAbonoModal && (
        <AbonoModal
          sale={showAbonoModal}
          onClose={() => setShowAbonoModal(null)}
          onSave={async (amount, notes) => {
            const ok = await act(() => registerSaleAbono(showAbonoModal.id, amount, notes));
            if (ok) setShowAbonoModal(null);
          }}
        />
      )}
      {showClosureModal && shiftStatus && (
        <ClosureModal
          inventory={shiftStatus.inventory}
          onClose={() => setShowClosureModal(false)}
          onSave={async (payload) => {
            setError("");
            try {
              const res = await submitShiftClosure(payload);
              if (res && !res.success) setError(res.message || "No se pudo enviar el cuadre");
              setShowClosureModal(false);
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error");
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Modal: producto (solo admin) ────────────────────────────────────────────

function ProductModal({ product, gyms, onClose, onSave }: {
  product: Product | null;
  gyms: { id: string; name: string }[];
  onClose: () => void;
  onSave: (payload: { gymId: string; name: string; category?: string; costPrice: string; salePrice: string; stock: number }, productId?: string) => Promise<void>;
}) {
  const [form, setForm] = useState({
    gymId: product?.gymId ?? gyms[0]?.id ?? "",
    name: product?.name ?? "",
    category: product?.category ?? "",
    costPrice: product?.costPrice ?? "",
    salePrice: product?.salePrice ?? "",
    stock: product?.stock ?? 0,
  });
  const [saving, setSaving] = useState(false);

  return (
    <Modal title={product ? "Editar producto" : "Nuevo producto"} onClose={onClose}>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault(); setSaving(true);
        await onSave({ ...form, category: form.category || undefined, stock: Number(form.stock) }, product?.id);
        setSaving(false);
      }}>
        {!product && (
          <div>
            <label className={labelCls}>Sede</label>
            <select value={form.gymId} onChange={(e) => setForm({ ...form, gymId: e.target.value })} className={inputCls}>
              {gyms.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className={labelCls}>Nombre</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Ej. Agua pura 600ml" />
        </div>
        <div>
          <label className={labelCls}>Categoría (opcional)</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} placeholder="Bebidas, Suplementos..." />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>P. compra (Q)</label>
            <input required type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>P. venta (Q)</label>
            <input required type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Stock</label>
            <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={inputCls} />
          </div>
        </div>
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

// ─── Modal: nueva venta ──────────────────────────────────────────────────────

function SaleModal({ products, onClose, onSave }: {
  products: Product[];
  onClose: () => void;
  onSave: (payload: { productId: string; quantity: number; memberId?: string | null; amountPaid: string; status: "pagada" | "credito" | "apartado"; notes?: string }) => Promise<void>;
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"pagada" | "credito" | "apartado">("pagada");
  const [amountPaid, setAmountPaid] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<{ id: string; name: string; code: string }[]>([]);
  const [member, setMember] = useState<{ id: string; name: string; code: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const product = products.find((p) => p.id === productId);
  const total = product ? Number(product.salePrice) * quantity : 0;

  useEffect(() => {
    if (status === "pagada") setAmountPaid(total.toFixed(2));
  }, [status, total]);

  useEffect(() => {
    if (memberQuery.length < 2) { setMemberResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await searchMembersForPayment(memberQuery);
        setMemberResults(res.map((m) => ({ id: m.id, name: m.name, code: m.code })));
      } catch { /* noop */ }
    }, 350);
    return () => clearTimeout(t);
  }, [memberQuery]);

  return (
    <Modal title="Nueva venta" onClose={onClose}>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault(); setSaving(true);
        await onSave({
          productId, quantity, status,
          memberId: member?.id ?? null,
          amountPaid: amountPaid || "0",
        });
        setSaving(false);
      }}>
        <div>
          <label className={labelCls}>Producto</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
            {products.map((p) => (
              <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                {p.name} — {Q(p.salePrice)} ({p.stock} disp.)
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Cantidad</label>
            <input type="number" min={1} max={product?.stock ?? 99} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Total</label>
            <div className="px-3 py-2 rounded-lg bg-black/30 border border-olimpo-surface-light text-olimpo-gold font-bold">{Q(total)}</div>
          </div>
        </div>
        <div>
          <label className={labelCls}>Tipo de venta</label>
          <div className="grid grid-cols-3 gap-2">
            {([["pagada", "Pagada"], ["credito", "Crédito"], ["apartado", "Apartado"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setStatus(k)}
                className={`py-2 rounded-lg text-sm font-bold border ${status === k ? "bg-olimpo-gold text-black border-olimpo-gold" : "text-olimpo-text-muted border-olimpo-surface-light"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {status !== "pagada" && (
          <>
            <div>
              <label className={labelCls}>Miembro responsable (obligatorio)</label>
              {member ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-olimpo-gold/10 border border-olimpo-gold/40">
                  <span className="text-olimpo-text text-sm">{member.name} ({member.code})</span>
                  <button type="button" onClick={() => setMember(null)}><X className="w-4 h-4 text-olimpo-text-muted" /></button>
                </div>
              ) : (
                <>
                  <input value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} className={inputCls} placeholder="Buscar por nombre o carné..." />
                  {memberResults.length > 0 && (
                    <div className="mt-1 rounded-lg border border-olimpo-surface-light divide-y divide-olimpo-surface-light/50 max-h-40 overflow-y-auto">
                      {memberResults.map((m) => (
                        <button key={m.id} type="button" onClick={() => { setMember(m); setMemberResults([]); setMemberQuery(""); }}
                          className="w-full text-left px-3 py-2 text-sm text-olimpo-text hover:bg-olimpo-surface-light/40">
                          {m.name} <span className="text-olimpo-text-muted">({m.code})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <p className="text-xs text-olimpo-text-muted mt-1">
                Si no paga, el saldo pendiente se sumará a su próxima mensualidad.
              </p>
            </div>
            <div>
              <label className={labelCls}>Abono inicial (Q, puede ser 0)</label>
              <input type="number" step="0.01" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className={inputCls} />
            </div>
          </>
        )}
        <ModalActions saving={saving} onClose={onClose} disabled={status !== "pagada" && !member} />
      </form>
    </Modal>
  );
}

// ─── Modal: abono ────────────────────────────────────────────────────────────

function AbonoModal({ sale, onClose, onSave }: {
  sale: Sale;
  onClose: () => void;
  onSave: (amount: string, notes?: string) => Promise<void>;
}) {
  const saldo = Number(sale.total) - Number(sale.amountPaid);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Modal title={`Abono — ${sale.productName}`} onClose={onClose}>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault(); setSaving(true);
        await onSave(amount, notes || undefined);
        setSaving(false);
      }}>
        <div className="p-3 rounded-lg bg-black/30 border border-olimpo-surface-light text-sm space-y-1">
          <p className="text-olimpo-text-muted">Total: <span className="text-olimpo-text font-bold">{Q(sale.total)}</span></p>
          <p className="text-olimpo-text-muted">Pagado: <span className="text-green-400 font-bold">{Q(sale.amountPaid)}</span></p>
          <p className="text-olimpo-text-muted">Saldo: <span className="text-red-400 font-bold">{Q(saldo)}</span></p>
        </div>
        <div>
          <label className={labelCls}>Monto del abono (Q)</label>
          <input required autoFocus type="number" step="0.01" min="0.01" max={saldo} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nota (opcional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </div>
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

// ─── Modal: cierre de turno ──────────────────────────────────────────────────

function ClosureModal({ inventory, onClose, onSave }: {
  inventory: { id: string; name: string; stock: number }[];
  onClose: () => void;
  onSave: (payload: { countedCash: string; stockOk: boolean; discrepancies?: string; notes?: string }) => Promise<void>;
}) {
  const [countedCash, setCountedCash] = useState("");
  const [stockOk, setStockOk] = useState(true);
  const [discrepancies, setDiscrepancies] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Modal title="Cuadre de cierre de turno" onClose={onClose}>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault(); setSaving(true);
        await onSave({ countedCash, stockOk, discrepancies: stockOk ? undefined : discrepancies, notes: notes || undefined });
        setSaving(false);
      }}>
        <p className="text-sm text-olimpo-text-muted">
          Cuenta el efectivo de tus ventas y verifica el inventario físico contra el sistema:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
          {inventory.map((p) => (
            <div key={p.id} className="bg-black/30 rounded px-2 py-1 text-xs flex justify-between">
              <span className="text-olimpo-text truncate mr-1">{p.name}</span>
              <span className="text-olimpo-gold font-bold">{p.stock}</span>
            </div>
          ))}
        </div>
        <div>
          <label className={labelCls}>Efectivo contado (Q)</label>
          <input required type="number" step="0.01" min="0" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>¿El inventario físico cuadra con el sistema?</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setStockOk(true)}
              className={`py-2 rounded-lg text-sm font-bold border ${stockOk ? "bg-green-500/20 text-green-400 border-green-500/50" : "text-olimpo-text-muted border-olimpo-surface-light"}`}>
              ✓ Sí, cuadra
            </button>
            <button type="button" onClick={() => setStockOk(false)}
              className={`py-2 rounded-lg text-sm font-bold border ${!stockOk ? "bg-red-500/20 text-red-400 border-red-500/50" : "text-olimpo-text-muted border-olimpo-surface-light"}`}>
              ✗ Hay faltante
            </button>
          </div>
        </div>
        {!stockOk && (
          <div>
            <label className={labelCls}>Detalle del faltante (lo repone la secretaria)</label>
            <textarea required value={discrepancies} onChange={(e) => setDiscrepancies(e.target.value)} className={inputCls} rows={2}
              placeholder="Ej. Faltan 2 aguas puras y 1 Gatorade" />
          </div>
        )}
        <div>
          <label className={labelCls}>Notas (opcional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </div>
        <ModalActions saving={saving} onClose={onClose} label="Enviar cuadre" />
      </form>
    </Modal>
  );
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-olimpo-surface border border-olimpo-surface-light p-6 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-olimpo-gold font-serif">{title}</h2>
          <button onClick={onClose} className="text-olimpo-text-muted hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ saving, onClose, disabled, label = "Guardar" }: { saving: boolean; onClose: () => void; disabled?: boolean; label?: string }) {
  return (
    <div className="pt-2 flex justify-end gap-3">
      <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-olimpo-text-muted hover:bg-olimpo-surface-light">Cancelar</button>
      <button type="submit" disabled={saving || disabled}
        className="px-4 py-2 rounded-lg bg-olimpo-gold text-black font-bold hover:bg-olimpo-gold/90 disabled:opacity-50 flex items-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
      </button>
    </div>
  );
}
