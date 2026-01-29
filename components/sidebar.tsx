"use client";

import Link from "next/link";
import {
    Shield, Home, FileText, Activity, LogOut, Terminal, Settings,
    Book, BookOpen, ShieldCheck, CreditCard, Zap, Crown, Sparkles,
    Clock, AlertCircle
} from "lucide-react";
import { getMyUpgradeRequest } from "@/app/upgrade-actions";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useFrontendSwarm } from "@/hooks/use-swarm";
import { useEffect, useState } from "react";

/**
 * [SWARM - SIDEBAR]
 * Adaptive navigation with hydration awareness and real-time plan sync.
 */

// Plan configurations for UI rendering
const PLAN_CONFIG = {
    STARTER: {
        label: 'Starter',
        color: 'text-slate-400',
        bgColor: 'bg-slate-400/10',
        borderColor: 'border-slate-400/20',
        icon: Zap,
        features: ['FE']
    },
    BUSINESS: {
        label: 'Business',
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-400/10',
        borderColor: 'border-indigo-400/20',
        icon: Sparkles,
        features: ['FE', 'REP', 'FEC']
    },
    ENTERPRISE: {
        label: 'Enterprise',
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/10',
        borderColor: 'border-amber-400/20',
        icon: Crown,
        features: ['FE', 'REP', 'FEC', 'API']
    }
};

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isHydrated, session, updateSession } = useFrontendSwarm();
    const [livePlan, setLivePlan] = useState<string | null>(null);
    const [isCheckingUpgrade, setIsCheckingUpgrade] = useState(false);
    const [hasPendingUpgrade, setHasPendingUpgrade] = useState(false);

    // Get plan from session (may be stale) or live fetch
    const sessionPlan = (session?.user as any)?.plan || 'STARTER';
    const currentPlan = livePlan || sessionPlan;
    const planConfig = PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.STARTER;
    const PlanIcon = planConfig.icon;

    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const subscriptionStatus = (session?.user as any)?.subscriptionStatus;
    const isSubscriptionActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

    // Determine feature access based on plan
    const hasPremiumFeatures = ['BUSINESS', 'ENTERPRISE'].includes(currentPlan);
    const hasApiAccess = currentPlan === 'ENTERPRISE' || isAdmin;

    // [SYNC] Refresh session when coming back from Stripe or on subscription change detection
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success' || urlParams.get('upgraded') === 'true') {
            updateSession?.();
        }

        const checkUpgrade = async () => {
            const req = await getMyUpgradeRequest();
            setHasPendingUpgrade(req?.status === 'PENDING');
        };
        checkUpgrade();
    }, [updateSession]);

    if (!isHydrated) return <div className="w-20 md:w-64 border-r border-white/5 bg-slate-950/50 h-screen" />;

    return (
        <aside className="w-20 md:w-64 border-r border-white/5 bg-slate-950/50 flex flex-col p-4 z-50 transition-all group overflow-hidden h-screen">
            {/* Logo */}
            <div className="flex items-center gap-3 px-2 mb-6 h-10">
                <div className="min-w-10 h-10 flex items-center justify-center p-1">
                    <img src="/logo-hacienda-core.svg" alt="HC" className="w-8 h-8" />
                </div>
                <span className="font-bold text-lg tracking-tight opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity whitespace-nowrap text-white">HaciendaCore</span>
            </div>

            {/* Plan Badge */}
            <div className="px-2 mb-6 opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${planConfig.bgColor} border ${planConfig.borderColor}`}>
                    <PlanIcon className={`w-4 h-4 ${planConfig.color}`} />
                    <div className="flex-1">
                        <span className={`text-xs font-bold ${planConfig.color} uppercase tracking-wider`}>
                            {planConfig.label}
                        </span>
                        {!isSubscriptionActive && currentPlan !== 'STARTER' && !hasPendingUpgrade && (
                            <p className="text-[9px] text-red-400">Pago pendiente</p>
                        )}
                        {hasPendingUpgrade && (
                            <p className="text-[9px] text-amber-400 flex items-center gap-1">
                                <Clock className="w-2 h-2 animate-pulse" /> Verificando...
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {/* Core Features - Available to all */}
                <NavLink href="/dashboard" icon={<Home className="w-5 h-5" />} label="Dashboard" active={pathname === '/dashboard'} />
                <NavLink href="/new" icon={<FileText className="w-5 h-5" />} label="Nueva Emisión" active={pathname === '/new'} />
                <NavLink href="/invoices" icon={<Activity className="w-5 h-5" />} label="Historial" active={pathname === '/invoices'} />

                <div className="h-px bg-white/5 my-4 mx-2" />

                <NavLink href="/dashboard/guide" icon={<BookOpen className="w-5 h-5" />} label="Guía de Usuario" active={pathname === '/dashboard/guide'} />

                {/* Business/Enterprise Features */}
                {hasPremiumFeatures && (
                    <>
                        <div className="h-px bg-white/5 my-4 mx-2" />
                        <div className="px-3 mb-2">
                            <span className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-widest">Premium</span>
                        </div>
                        {/* REP/FEC access indicator - These are enabled via the /new page type selector */}
                    </>
                )}

                {/* Enterprise-Only Features */}
                {hasApiAccess && (
                    <>
                        <NavLink href="/dashboard/api" icon={<Terminal className="w-5 h-5 text-amber-400" />} label="API / Acceso" active={pathname === '/dashboard/api'} />
                        <NavLink href="/dashboard/docs" icon={<Book className="w-5 h-5" />} label="Docs Desarrollador" active={pathname === '/dashboard/docs'} />
                    </>
                )}

                {/* Admin-Only Features */}
                {isAdmin && (
                    <>
                        <div className="px-3 mb-2 mt-4">
                            <span className="text-[9px] font-bold text-amber-400/60 uppercase tracking-widest">Admin</span>
                        </div>
                        <NavLink href="/admin/upgrades" icon={<CreditCard className="w-5 h-5 text-amber-500" />} label="Gestión Upgrades" active={pathname === '/admin/upgrades'} />
                        <NavLink href="/dashboard/qa/playground" icon={<ShieldCheck className="w-5 h-5 text-amber-500" />} label="Lab Swarm (QA)" active={pathname === '/dashboard/qa/playground'} />
                    </>
                )}

                <div className="h-px bg-white/5 my-4 mx-2" />

                <NavLink href="/dashboard/settings" icon={<Settings className="w-5 h-5" />} label="Ajustes" active={pathname === '/dashboard/settings'} />
                <NavLink href="/dashboard/billing" icon={<CreditCard className="w-5 h-5" />} label="Facturación" active={pathname === '/dashboard/billing'} />

                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-slate-400 transition-all group/logout w-full mt-4 text-left"
                >
                    <LogOut className="w-5 h-5 group-hover/logout:text-red-500" />
                    <span className="font-medium text-sm whitespace-nowrap">Cerrar Sesión</span>
                </button>
            </nav>

            {/* Status Footer */}
            <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2">
                    <div className={`w-2 h-2 rounded-full ${isSubscriptionActive || currentPlan === 'STARTER' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {isSubscriptionActive || currentPlan === 'STARTER' ? 'Sistema OK' : 'Pago Requerido'}
                    </span>
                </div>
            </div>
        </aside>
    );
}

function NavLink({ href, icon, label, active, locked }: { href: string; icon: React.ReactNode; label: string; active?: boolean; locked?: boolean }) {
    return (
        <Link
            href={locked ? '#' : href}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all group/link relative overflow-hidden ${locked
                ? 'opacity-40 cursor-not-allowed'
                : active
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-white/5 hover:text-primary text-slate-400'
                }`}
            onClick={locked ? (e) => e.preventDefault() : undefined}
        >
            <div className={`${active ? 'text-primary' : 'text-slate-400 group-hover/link:text-primary'} transition-colors`}>{icon}</div>
            <span className="font-medium text-sm whitespace-nowrap">{label}</span>
            {locked && <span className="text-[8px] text-amber-400 ml-auto">PRO</span>}
        </Link>
    );
}
