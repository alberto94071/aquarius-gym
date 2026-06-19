import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aquarius Gym | Sistema Administrativo",
  description: "Plataforma oficial de administración, gestión de miembros y pagos para Aquarius Gym.",
  openGraph: {
    title: "Aquarius Gym | CRM",
    description: "Sistema de administración oficial. Control de acceso, pagos y miembros.",
    url: "https://crm-olimpo-gym.vercel.app",
    siteName: "Aquarius Gym",
    images: [
      {
        url: "https://crm-olimpo-gym.vercel.app/logo.jpeg",
        width: 800,
        height: 800,
        alt: "Logotipo Oficial de Aquarius Gym",
      },
    ],
    locale: "es_GT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aquarius Gym | CRM",
    description: "Sistema de administración oficial para Aquarius Gym.",
    images: ["https://crm-olimpo-gym.vercel.app/logo.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${cinzel.variable} dark`}>
      <body className="antialiased bg-olimpo-bg text-olimpo-text selection:bg-olimpo-gold/30">
        {children}
      </body>
    </html>
  );
}
