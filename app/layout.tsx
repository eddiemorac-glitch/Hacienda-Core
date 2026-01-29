import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NovaShell } from "@/components/nova-shell";
import { AuthProvider } from "@/components/auth-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nova Billing | Sentinel Electronic Control v4.4",
  description: "Advanced Electronic Invoicing Infrastructure for Costa Rica. Secured by Sentinel Swarm.",
  icons: {
    icon: "/logo-hacienda-core.svg",
    apple: "/logo-hacienda-core.svg",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#020617] text-slate-200 min-h-screen`} suppressHydrationWarning>
        <AuthProvider>
          <NovaShell>
            {children}
          </NovaShell>
        </AuthProvider>
      </body>
    </html>
  );
}
