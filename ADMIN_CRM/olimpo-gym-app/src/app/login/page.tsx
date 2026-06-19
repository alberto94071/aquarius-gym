import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  const handleGoogleSignIn = async () => {
    "use server"
    await signIn("google", { redirectTo: "/dashboard" })
  }

  const handleCredentialsSignIn = async (formData: FormData) => {
    "use server"
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/dashboard",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.type === "CredentialsSignin") {
          redirect("/login?error=CredentialsSignin");
        }
        redirect("/login?error=Default");
      }
      throw error;
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-olimpo-bg relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="absolute top-0 left-0 w-full h-full border-[8px] border-olimpo-surface pointer-events-none opacity-30 z-0"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-olimpo-gold/20 rounded-full blur-[100px] z-0"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-olimpo-gold/20 rounded-full blur-[100px] z-0"></div>

      <div className="w-full max-w-md p-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full border-2 border-olimpo-gold/50 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(197,165,90,0.3)] overflow-hidden bg-black">
            <img src="/logo.jpeg" alt="Aquarius Gym Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-olimpo-gold tracking-widest text-center mt-2">
            AQUARIUS GYM
          </h1>
          <p className="text-olimpo-text-muted mt-2 text-sm uppercase tracking-widest font-sans">
            Portal Administrativo
          </p>
        </div>

        {searchParams?.error === "CredentialsSignin" && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">
            Credenciales incorrectas o usuario no activo.
          </div>
        )}

        <form action={handleCredentialsSignIn} className="flex flex-col gap-4 font-sans mb-6">
          <div>
            <label className="text-xs text-olimpo-text-muted uppercase tracking-wider mb-1 block">Correo Electrónico</label>
            <input 
              type="email" 
              name="email"
              required 
              className="w-full bg-black/50 border border-olimpo-surface p-3 rounded-lg text-olimpo-text outline-none focus:border-olimpo-gold transition-colors"
              placeholder="admin@aquariusgym.com"
            />
          </div>
          <div>
            <label className="text-xs text-olimpo-text-muted uppercase tracking-wider mb-1 block">Contraseña</label>
            <input 
              type="password" 
              name="password"
              required 
              className="w-full bg-black/50 border border-olimpo-surface p-3 rounded-lg text-olimpo-text outline-none focus:border-olimpo-gold transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-olimpo-gold text-black py-3 px-4 rounded-lg font-bold hover:bg-olimpo-gold/90 transition-all active:scale-[0.98] mt-2"
          >
            Ingresar
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-olimpo-surface flex-1"></div>
          <span className="text-xs text-olimpo-text-muted uppercase tracking-wider">O continuar con</span>
          <div className="h-px bg-olimpo-surface flex-1"></div>
        </div>

        <form action={handleGoogleSignIn} className="flex flex-col gap-4 font-sans">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 px-4 rounded-lg font-semibold transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          
          <p className="text-xs text-center text-olimpo-text-muted mt-2">
            Solo cuentas pre-autorizadas por el administrador pueden acceder a este portal.
          </p>
        </form>
      </div>
    </div>
  );
}
