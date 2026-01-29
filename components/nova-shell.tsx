"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useFrontendSwarm } from "@/hooks/use-swarm";

/**
 * [SWARM - CORE SHELL]
 * Orchestrates the main layout with hydration and auth awareness.
 */

export function NovaShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isHydrated } = useFrontendSwarm();

    // Auth pages and public routes (including forgot-password and reset-password)
    const isAuthPage = pathname === "/" ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname?.startsWith("/forgot-password") ||
        pathname?.startsWith("/reset-password");

    // Prevent hydration mismatch on the shell itself
    if (!isHydrated) return <div className="min-h-screen bg-[#020617]" />;

    if (isAuthPage) {
        return <div className="min-h-screen w-full overflow-auto bg-[#020617]">{children}</div>;
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#020617]">
            <Sidebar />
            <main className="flex-1 overflow-auto relative bg-[#020617] text-slate-200">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <div className="relative z-10 min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
