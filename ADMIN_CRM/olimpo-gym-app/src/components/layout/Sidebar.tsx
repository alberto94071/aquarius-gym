"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  Megaphone,
  Activity,
  PersonStanding,
  Dumbbell,
  ListChecks,
  Tv2,
  X,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ShieldCheck,
  BarChart2,
  ShoppingCart,
} from "lucide-react";

const MENU_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Miembros", href: "/members", icon: Users },
  { name: "Grupos", href: "/groups", icon: UserPlus },
  { name: "Pagos", href: "/payments", icon: CreditCard },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart },
  { name: "Anuncios", href: "/announcements", icon: Megaphone },
];

const FITNESS_ITEMS = [
  { name: "Ejercicios", href: "/exercises", icon: Dumbbell },
  { name: "Rutinas", href: "/routines", icon: ListChecks },
  { name: "Contenido App", href: "/content", icon: Tv2 },
];

const ADMIN_ITEMS = [
  { name: "Finanzas", href: "/finanzas", icon: BarChart2 },
  { name: "Precios", href: "/pricing", icon: CircleDollarSign },
  { name: "Roles", href: "/roles", icon: ShieldCheck },
];

const UPCOMING_ITEMS = [
  { name: "Cuerpo 3D", icon: PersonStanding },
  { name: "Progreso", icon: Activity },
];

export function Sidebar({ 
  userRole, 
  mobileOpen, 
  onCloseMobile, 
  desktopCollapsed, 
  onToggleDesktop 
}: { 
  userRole?: string, 
  mobileOpen: boolean, 
  onCloseMobile: () => void,
  desktopCollapsed: boolean,
  onToggleDesktop: () => void
}) {
  const pathname = usePathname();

  return (
    <aside 
      className={`bg-black/40 backdrop-blur-xl border-r border-white/10 h-screen fixed left-0 top-0 z-50 flex flex-col transition-all duration-300 ease-in-out
        ${desktopCollapsed ? "w-20" : "w-64"} 
        ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Sidebar Header / Logo area (Mobile mainly) */}
      <div 
        className="h-24 flex items-center justify-between px-4 border-b border-olimpo-surface-light cursor-pointer hover:bg-olimpo-surface-light/30 transition-colors"
        onClick={onToggleDesktop}
      >
        <div className={`flex items-center gap-3 ${desktopCollapsed && !mobileOpen ? 'justify-center w-full' : ''}`}>
          <div className={`shrink-0 rounded-full border-2 border-olimpo-gold/50 flex items-center justify-center shadow-[0_0_20px_rgba(197,165,90,0.25)] overflow-hidden bg-black transition-all duration-300 ${desktopCollapsed && !mobileOpen ? 'w-12 h-12' : 'w-20 h-20'}`}>
            <img src="/AQUARIUS-LOGO.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          {(!desktopCollapsed || mobileOpen) && (
            <div className="flex flex-col justify-center">
              <h2 className="font-serif font-bold text-olimpo-gold tracking-widest text-lg leading-tight truncate">AQUARIUS</h2>
              <h2 className="font-serif font-bold text-olimpo-gold tracking-widest text-lg leading-tight truncate">GYM</h2>
            </div>
          )}
        </div>
        
        {/* Mobile close button */}
        <button 
          onClick={onCloseMobile}
          className="md:hidden p-2 text-olimpo-text-muted hover:text-olimpo-text"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6 overflow-x-hidden custom-scrollbar">
        
        {/* Main Menu */}
        <div>
          {(!desktopCollapsed || mobileOpen) && (
            <p className="px-4 text-[10px] font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">
              Gestión
            </p>
          )}
          <ul className="space-y-1 px-2">
            {MENU_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={item.name}
                    onClick={() => mobileOpen && onCloseMobile()}
                    className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group relative ${
                      isActive 
                        ? "bg-olimpo-gold/10 text-olimpo-gold" 
                        : "text-olimpo-text hover:bg-olimpo-surface-light"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {(!desktopCollapsed || mobileOpen) && (
                      <span className="font-medium ml-3 truncate">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Fitness Menu */}
        <div>
          {(!desktopCollapsed || mobileOpen) && (
            <p className="px-4 text-[10px] font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">
              Fitness
            </p>
          )}
          <ul className="space-y-1 px-2">
            {FITNESS_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={item.name}
                    onClick={() => mobileOpen && onCloseMobile()}
                    className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group relative ${
                      isActive
                        ? "bg-olimpo-gold/10 text-olimpo-gold"
                        : "text-olimpo-text hover:bg-olimpo-surface-light"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {(!desktopCollapsed || mobileOpen) && (
                      <span className="font-medium ml-3 truncate">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Admin Menu */}
        {userRole === "admin" && (
          <div>
            {(!desktopCollapsed || mobileOpen) && (
              <p className="px-4 text-[10px] font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">
                Administración
              </p>
            )}
            <ul className="space-y-1 px-2">
              {ADMIN_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      title={item.name}
                      onClick={() => mobileOpen && onCloseMobile()}
                      className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group relative ${
                        isActive 
                          ? "bg-olimpo-gold/10 text-olimpo-gold" 
                          : "text-olimpo-text hover:bg-olimpo-surface-light"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {(!desktopCollapsed || mobileOpen) && (
                        <span className="font-medium ml-3 truncate">{item.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Upcoming Menu */}
        <div>
          {(!desktopCollapsed || mobileOpen) && (
            <p className="px-4 text-[10px] font-semibold text-olimpo-text-muted uppercase tracking-wider mb-2">
              Próximamente
            </p>
          )}
          <ul className="space-y-1 px-2">
            {UPCOMING_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <div 
                    title={item.name}
                    className="flex items-center px-3 py-2.5 rounded-lg text-gray-600 cursor-not-allowed opacity-50"
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {(!desktopCollapsed || mobileOpen) && (
                      <span className="font-medium ml-3 truncate">{item.name}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Desktop Collapse Toggle (Protruding Tab) */}
      <button
        onClick={onToggleDesktop}
        className="hidden md:flex absolute top-10 -right-4 w-8 h-8 bg-olimpo-surface border border-olimpo-surface-light rounded-full items-center justify-center text-olimpo-text-muted hover:text-olimpo-gold hover:border-olimpo-gold shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-colors z-50"
      >
        {desktopCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Footer */}
      <div className="p-4 border-t border-olimpo-surface-light mt-auto">
        {(!desktopCollapsed || mobileOpen) ? (
          <div className="text-xs text-center text-olimpo-text-muted">
            <p>Made by</p>
            <a 
              href="https://www.chronos-dev.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-bold text-olimpo-gold hover:underline tracking-widest"
            >
              Chronos-Dev
            </a>
          </div>
        ) : (
          <div className="text-center text-[10px] text-olimpo-gold font-bold tracking-widest">
            <a 
              href="https://www.chronos-dev.com" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Made by Chronos-Dev"
              className="hover:underline"
            >
              C-D
            </a>
          </div>
        )}
      </div>

    </aside>
  );
}
