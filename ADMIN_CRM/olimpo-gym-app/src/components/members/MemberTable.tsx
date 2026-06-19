"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import Link from "next/link";

function thumbUrl(url: string): string {
  return url.replace("/upload/", "/upload/w_80,h_80,c_fill,g_face,q_auto,f_auto/");
}

function fullUrl(url: string): string {
  return url.replace("/upload/", "/upload/w_600,h_600,c_fill,g_face,q_auto,f_auto/");
}

function Avatar({ url, name, onClick }: { url?: string | null; name: string; onClick?: () => void }) {
  if (url) {
    return (
      <img
        src={thumbUrl(url)}
        alt={name}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover border border-olimpo-surface-light flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-olimpo-gold transition-all"
        onClick={(e) => { e.preventDefault(); onClick?.(); }}
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-olimpo-surface-light border border-olimpo-surface-light flex items-center justify-center flex-shrink-0">
      <span className="text-olimpo-gold font-bold text-sm">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function PhotoModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 bg-olimpo-surface rounded-full p-1.5 border border-olimpo-surface-light hover:border-olimpo-gold transition-colors"
        >
          <X className="w-4 h-4 text-olimpo-text" />
        </button>
        <img
          src={fullUrl(url)}
          alt={name}
          className="w-full rounded-2xl border-2 border-olimpo-gold/30 shadow-2xl"
        />
        <p className="text-center text-olimpo-text-muted text-sm mt-3">{name}</p>
      </div>
    </div>
  );
}

export function MemberTable({ members }: { members: any[] }) {
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

  if (members.length === 0) {
    return (
      <div className="bg-olimpo-surface rounded-2xl border border-olimpo-surface-light p-8 text-center">
        <p className="text-olimpo-text-muted mb-4">No hay miembros registrados todavía.</p>
        <Link
          href="/members/new"
          className="inline-flex items-center gap-2 bg-olimpo-gold text-black px-4 py-2 rounded-lg font-medium hover:bg-olimpo-gold-light transition-colors"
        >
          <Plus className="w-5 h-5" />
          Registrar el Primer Miembro
        </Link>
      </div>
    );
  }

  return (
    <>
      {lightbox && (
        <PhotoModal url={lightbox.url} name={lightbox.name} onClose={() => setLightbox(null)} />
      )}

      <div className="bg-olimpo-surface rounded-2xl border border-olimpo-surface-light shadow-lg overflow-hidden">
        {/* Mobile View (Cards) */}
        <div className="block md:hidden divide-y divide-olimpo-surface-light">
          {members.map((m) => (
            <div key={m.id} className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar
                    url={m.photoUrl}
                    name={m.name}
                    onClick={m.photoUrl ? () => setLightbox({ url: m.photoUrl, name: m.name }) : undefined}
                  />
                  <div>
                    <span className="text-xs text-olimpo-gold font-mono mb-1 block">{m.code}</span>
                    <h3 className="font-medium text-olimpo-text text-lg">{m.name}</h3>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${
                  m.status === "activo" ? "bg-olimpo-green/20 text-olimpo-green" :
                  m.status === "mora" ? "bg-olimpo-red/20 text-olimpo-red" :
                  "bg-olimpo-surface-light text-olimpo-text-muted"
                }`}>
                  {m.status === "activo" ? "Al día" : m.status === "mora" ? "En mora" : m.status}
                </span>
              </div>
              <div className="flex justify-between text-sm text-olimpo-text-muted">
                <span>Plan: {m.plan}</span>
                <span>Vence: {new Date(m.membershipEnd + "T00:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-olimpo-surface-light">
                <span className="font-bold text-olimpo-text">Q {m.price}</span>
                <Link href={`/members/${m.id}`} className="text-olimpo-gold hover:text-olimpo-gold-light text-sm font-medium">
                  Gestionar
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-olimpo-surface-light/50 border-b border-olimpo-surface-light">
                <th className="px-6 py-4 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Vencimiento</th>
                <th className="px-6 py-4 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-olimpo-text-muted uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-olimpo-surface-light">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-olimpo-surface-light/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-olimpo-gold">
                    {m.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar
                        url={m.photoUrl}
                        name={m.name}
                        onClick={m.photoUrl ? () => setLightbox({ url: m.photoUrl, name: m.name }) : undefined}
                      />
                      <div>
                        <div className="font-medium text-olimpo-text">{m.name}</div>
                        <div className="text-xs text-olimpo-text-muted">{m.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-olimpo-text-muted capitalize">
                    {m.plan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-olimpo-text-muted">
                    {new Date(m.membershipEnd + "T00:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full uppercase tracking-wider ${
                      m.status === "activo" ? "bg-olimpo-green/10 text-olimpo-green" :
                      m.status === "mora" ? "bg-olimpo-red/10 text-olimpo-red" :
                      "bg-olimpo-surface-light text-olimpo-text-muted"
                    }`}>
                      {m.status === "activo" ? "Al día" : m.status === "mora" ? "En mora" : m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/members/${m.id}`} className="text-olimpo-gold hover:text-olimpo-gold-light transition-colors p-2 text-sm font-bold tracking-widest uppercase">
                      Gestionar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
