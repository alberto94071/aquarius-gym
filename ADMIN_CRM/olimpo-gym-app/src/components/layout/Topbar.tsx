import { Dumbbell, LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";

export function Topbar({ user, onOpenMobileMenu }: { user: any, onOpenMobileMenu: () => void }) {
  return (
    <header className="h-16 bg-black/40 backdrop-blur-md border-b border-white/10 fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-6 overflow-hidden">
      

      
      {/* Left side: Hamburger (Mobile) & Logo */}
      <div className="flex items-center gap-3 md:hidden z-10">
        <button 
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-olimpo-text-muted hover:text-olimpo-text rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Spacing for desktop so it aligns with sidebar */}
      <div className="hidden md:block w-10"></div>

      {/* Right side: User Profile */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto z-10">
        <div className="flex items-center gap-2 sm:gap-3 bg-olimpo-surface-light py-1 pl-1 pr-3 sm:pr-4 rounded-full border border-olimpo-surface">
          <div className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-full overflow-hidden bg-gray-700">
            {user?.image ? (
              <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-olimpo-gold flex items-center justify-center text-xs text-black font-bold">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div className="flex flex-col max-w-[100px] sm:max-w-[150px]">
            <span className="text-xs sm:text-sm font-medium text-olimpo-text leading-tight truncate">
              {user?.name}
            </span>
            <span className="text-[9px] sm:text-[10px] text-olimpo-gold font-bold uppercase tracking-wider mt-0.5 truncate">
              {user?.role === "admin" ? "Administrador" : "Secretaria"}
            </span>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 text-olimpo-text-muted hover:text-olimpo-red hover:bg-olimpo-red/10 rounded-lg transition-colors shrink-0"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
}
