"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFrontendSwarm } from "@/hooks/use-swarm"; // [SYNC]
import { SwarmHealthMonitor } from "@/components/swarm-health";
import { SentinelNotifications } from "@/components/sentinel-notifications";
import { PredictivePrefetch } from "@/components/predictive-prefetch";
import { SentinelCoach } from "@/components/sentinel-coach";
import {
    ShieldCheck,
    FileText,
    Plus,
    Search,
    RefreshCw,
    CreditCard,
    ExternalLink,
    Zap,
    Loader2,
    Activity,
    Server,
    ChevronRight,
    TrendingUp,
    LayoutDashboard,
    ArrowUpRight,
    ArrowRight,
    Clock,
    Download,
    X,
    Lock,
    AlertCircle
} from "lucide-react";
import { getDashboardStats, getLatestInvoices } from "./actions/stats";
import { verifyHaciendaStatus, queryHaciendaStatusByClave } from "../actions";
import { getLastInvoiceClave } from "./qa/actions";
import { createPortalSession } from "../stripe-actions";
import { AuditLogFeed } from "./audit-feed";
import { getMyUpgradeRequest } from "@/app/upgrade-actions";

/**
 * [SENTINEL DASHBOARD - HYPER PREMIUM EDITION]
 * Orchestrated cockpit for high-volume electronic billing.
 */

export default function DashboardPage() {
    const router = useRouter();
    const { updateSession } = useFrontendSwarm(); // [SYNC] Access orchestrator
    const [stats, setStats] = useState<any>({ todayCount: 0, totalPending: 0, totalInvoiceCount: 0, org: null });
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    // [MANUAL VERIFICATION STATE]
    const [manualClave, setManualClave] = useState("");
    const [manualResult, setManualResult] = useState<any>(null);
    const [isManualQuerying, setIsManualQuerying] = useState(false);

    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [pendingUpgrade, setPendingUpgrade] = useState<any>(null);

    const isExpired = stats?.org?.subscriptionEndsAt &&
        new Date(stats?.org?.subscriptionEndsAt) < new Date() &&
        stats?.org?.subscriptionStatus !== 'active';

    useEffect(() => {
        // [PAYMENT DETECTION] Check if we just came back from a successful Stripe checkout
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
            setShowPaymentSuccess(true);

            // [SWARM SYNC] Force session update to unlock Sidebar features immediately
            updateSession().then(() => {
                console.log("🔒 [SESSION] Privileges upgraded in real-time.");
            });

            // Clean URL
            window.history.replaceState({}, '', '/dashboard');

            // Auto-hide after 10s
            const timer = setTimeout(() => setShowPaymentSuccess(false), 10000);
            return () => clearTimeout(timer);
        }

        async function loadData() {
            try {
                const [statsData, invoicesData, pendingReq] = await Promise.all([
                    getDashboardStats(),
                    getLatestInvoices(),
                    getMyUpgradeRequest()
                ]);
                setStats(statsData);
                setInvoices(invoicesData);
                setPendingUpgrade(pendingReq);

                // [HYBRID SYNC] Si la solicitud está aprobada pero el plan en sesión es viejo, refrescar
                if (pendingReq?.status === 'APPROVED' && statsData?.org?.plan !== pendingReq.requestedPlan) {
                    console.log("♻️ [SYNC] Pago aprobado detectado. Sincronizando privilegios...");
                    updateSession();
                    setShowPaymentSuccess(true);
                }
            } catch (e) {
                console.error("Dashboard Load Error", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleSyncStatus = async (invoiceId: string) => {
        setSyncingId(invoiceId);
        try {
            const res = await verifyHaciendaStatus(invoiceId);
            if (res.success) {
                // Update local state without full reload
                setInvoices(prev => prev.map(inv =>
                    inv.id === invoiceId ? { ...inv, estado: res.haciendaResponse?.['ind-estado']?.toUpperCase() || inv.estado } : inv
                ));
            } else {
                alert(`Error al sincronizar: ${res.error}`);
            }
        } catch (e) {
            console.error("Sync Error", e);
        } finally {
            setSyncingId(null);
        }
    };

    const handleManualVerify = async () => {
        if (manualClave.length < 50) {
            alert("La clave debe tener 50 dígitos.");
            return;
        }
        setIsManualQuerying(true);
        setManualResult(null);
        try {
            const res = await queryHaciendaStatusByClave(manualClave);
            setManualResult(res);
        } catch (e) {
            console.error("Manual Query Error", e);
        } finally {
            setIsManualQuerying(false);
        }
    };

    const handleFetchLastClave = async () => {
        try {
            const clave = await getLastInvoiceClave();
            if (clave) setManualClave(clave);
            else alert("No se encontraron facturas recientes.");
        } catch (e) {
            console.error("Fetch Last Clave Error", e);
        }
    };



    return (
        <div className="flex min-h-screen flex-col items-center p-8 sm:p-20 relative overflow-hidden bg-[#020617] selection:bg-primary/20">
            <SentinelNotifications />
            <PredictivePrefetch />

            {/* [PHASE 9] Lockout Overlay for Expired Subscriptions */}
            <AnimatePresence>
                {isExpired && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-[#020617]/90 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="max-w-md w-full premium-card p-10 border-red-500/30 text-center space-y-8 shadow-[0_40px_100px_-20px_rgba(239,68,68,0.3)]"
                        >
                            <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto text-rose-500 border border-rose-500/30">
                                <Lock className="w-10 h-10" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Nodo Restringido</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Sentinel ha detectado que su período de suscripción ha expirado. Por seguridad y cumplimiento legal, las funciones de emisión han sido pausadas.
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fin de Ciclo</p>
                                <p className="font-mono text-white text-lg">{new Date(stats.org.subscriptionEndsAt).toLocaleDateString()}</p>
                            </div>
                            <Link href="/dashboard/billing/checkout" className="block w-full">
                                <button className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                                    Reactivar con SINPE <ArrowRight className="ml-2 w-4 h-4 inline" />
                                </button>
                            </Link>
                            <p className="text-[10px] text-slate-500 font-medium">Si ya realizó el pago, por favor espere la aprobación del administrador.</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cinematic Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[60%] w-[1px] h-[1px] shadow-[0_0_100px_40px_rgba(59,130,246,0.1)]" />
            </div>

            <AnimatePresence>
                {showPaymentSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-xl"
                    >
                        <div className="glass-card p-6 border-emerald-500/30 bg-emerald-500/10 backdrop-blur-2xl rounded-[2rem] flex items-center gap-6 shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)]">
                            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/40">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-emerald-400">Protocolo de Pago Exitoso</h3>
                                <p className="text-xs text-slate-300 font-medium">Su nodo ha sido actualizado y la potencia del sistema se ha incrementado al plan seleccionado.</p>
                            </div>
                            <button onClick={() => setShowPaymentSuccess(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upgrade Status Banners */}
            {pendingUpgrade && pendingUpgrade.status === 'PENDING' && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[140] w-[90%] max-w-xl">
                    <div className="glass-card p-5 border-amber-500/30 bg-amber-500/10 backdrop-blur-2xl rounded-2xl flex items-center gap-5 shadow-lg">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/30">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-black uppercase tracking-tight text-amber-400">Upgrade Pendiente</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Tu solicitud de plan {pendingUpgrade.requestedPlan} está siendo procesada.</p>
                        </div>
                        <Link href="/dashboard/billing/checkout" className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-bold transition-all border border-amber-500/30">
                            Ver Estado
                        </Link>
                    </div>
                </div>
            )}

            {pendingUpgrade && pendingUpgrade.status === 'REJECTED' && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[140] w-[90%] max-w-xl">
                    <div className="glass-card p-5 border-red-500/30 bg-red-500/10 backdrop-blur-2xl rounded-2xl flex items-center gap-5 shadow-lg">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 border border-red-500/30">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-black uppercase tracking-tight text-red-400">Pago Rechazado</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Motivo: {pendingUpgrade.adminNotes || "Comprobante ilegible o inválido."}
                            </p>
                        </div>
                        <Link href="/dashboard/billing/checkout" className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-all border border-red-500/30">
                            Reintentar
                        </Link>
                    </div>
                </div>
            )}

            <main className="flex flex-col gap-10 w-full max-w-6xl z-10 text-white">
                {/* Global Command Bar */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center w-full py-8 border-b border-white/5 gap-6">
                    <div className="flex items-center gap-4 group cursor-default">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                            <ShieldCheck className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter italic uppercase text-gradient">
                                {stats?.org?.name || "Sentinel Core"}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    NODE: {stats?.org?.id?.slice(0, 8).toUpperCase()}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${['BUSINESS', 'ENTERPRISE'].includes(stats?.org?.plan) ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-primary bg-primary/10 border-primary/20'
                                    }`}>
                                    PLAN: {stats?.org?.plan || 'TRIAL'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <SwarmHealthMonitor />

                        <div className="h-8 w-px bg-white/5 mx-2" />

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <Link href="/settings">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/10 hover:border-primary/50 transition-all group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="font-bold text-xs relative z-10">EM</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* [INTELLIGENT UPGRADE PROMPTS] */}
                {/* Alerta de Límite Cercano (80% de cuota STARTER) */}
                {stats.org?.plan === 'STARTER' && stats.totalInvoiceCount >= 40 && stats.totalInvoiceCount < 50 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Su negocio está creciendo rápido 🚀</h3>
                                <p className="text-sm text-slate-400">Ha consumido {stats.totalInvoiceCount} de 50 facturas disponibles en su plan Starter.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/billing')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Zap className="w-4 h-4" />
                            Actualizar a Business
                        </button>
                    </motion.div>
                )}

                {/* Alerta de Límite Alcanzado (100% de cuota STARTER) */}
                {stats.org?.plan === 'STARTER' && stats.totalInvoiceCount >= 50 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Límite operativo alcanzado</h3>
                                <p className="text-sm text-slate-400">Ha llegado al límite de 50 facturas. Para seguir facturando sin interrupciones, actualice su plan.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/billing')}
                            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 whitespace-nowrap"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Liberar Potencial Ilimitado
                        </button>
                    </motion.div>
                )}

                {/* Performance Analytics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="premium-card p-8 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:glow-primary transition-all">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full text-[9px] font-black">
                                <Zap className="w-3 h-3 fill-current" /> SYNCED
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Volumen Diario</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-6xl font-black italic tracking-tighter text-white">{stats.todayCount}</h2>
                                <span className="text-xs font-bold text-slate-600">DOCS</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="premium-card p-8 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                                <Activity className="w-6 h-6" />
                            </div>
                            {stats.totalPending > 0 ? (
                                <div className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full text-[9px] font-black animate-pulse">
                                    OUT OF SYNC
                                </div>
                            ) : (
                                <div className="text-slate-500 bg-white/5 px-2 py-1 rounded-full text-[9px] font-black uppercase">
                                    Optimal
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Cola de Contingencia</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-6xl font-black italic tracking-tighter text-white">{stats.totalPending}</h2>
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="premium-card p-8 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                <Lock className="w-6 h-6" />
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/billing')}
                                className="flex items-center gap-1 text-white bg-indigo-500 px-3 py-1 rounded-full text-[9px] font-black hover:scale-105 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                MEJORAR PLAN <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Nivel de Suscripción</p>
                            <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase mt-2">{stats.org?.plan || 'TRIAL'}</h2>
                            <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[70%]" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Operations & Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <LayoutDashboard className="w-3 h-3" /> Central de Operaciones
                            </h3>
                            <div className="grid gap-4">
                                <Link href="/new" className="w-full">
                                    <button className="w-full premium-card p-6 !rounded-3xl border-primary/10 hover:border-primary/40 transition-all flex items-center justify-between group overflow-hidden relative">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-12 h-12 bg-primary text-white rounded-[1.2rem] flex items-center justify-center group-hover:scale-110 transition-all shadow-[0_15px_30px_-10px_rgba(59,130,246,0.6)]">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Nueva Emisión</p>
                                                <p className="font-bold text-lg tracking-tight">Emitir Comprobante</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary transition-all relative z-10" />
                                    </button>
                                </Link>

                                <Link href="/invoices" className="w-full">
                                    <button className="w-full premium-card p-6 !rounded-3xl hover:border-white/20 transition-all flex items-center justify-between group overflow-hidden relative">
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-white/5 rounded-[1.2rem] flex items-center justify-center text-slate-400 group-hover:text-white transition-all">
                                                <Search className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Historial</p>
                                                <p className="font-bold text-lg tracking-tight">Buscar Documentos</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-all" />
                                    </button>
                                </Link>
                            </div>
                        </div>

                        {/* Automated Security Insights */}
                        <div className="premium-card p-6 !rounded-3xl bg-emerald-500/[0.02] border-emerald-500/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Bóveda Criptográfica Digital</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Sentinel ha verificado la integridad de sus llaves.
                                <span className="text-emerald-500/70 ml-1 font-bold">Arquitectura Zero-Knowledge iniciada.</span>
                            </p>
                        </div>

                        {/* [PHASE 12] Manual Verification Widget */}
                        <div className="premium-card p-8 !rounded-[2.5rem] border-primary/20 bg-primary/5 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/30">
                                    <ShieldCheck className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-tighter text-white">Verificador de Hacienda</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocolo de Consulta Directa</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Pegue los 50 dígitos de la Clave..."
                                        value={manualClave}
                                        onChange={(e) => setManualClave(e.target.value)}
                                        className="w-full bg-[#030816] border border-white/10 rounded-2xl p-5 text-xs font-mono text-primary placeholder:text-slate-700 focus:outline-none focus:border-primary/50 transition-all group-hover:border-white/20"
                                    />
                                    <button
                                        onClick={handleFetchLastClave}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-primary/20 rounded-xl transition-all text-slate-500 hover:text-primary"
                                        title="Cargar última clave emitida"
                                    >
                                        <Clock className="w-4 h-4" />
                                    </button>
                                </div>

                                <button
                                    onClick={handleManualVerify}
                                    disabled={isManualQuerying || !manualClave}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isManualQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Consultar en Tiempo Real
                                </button>
                            </div>

                            {manualResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-5 rounded-2xl border ${manualResult.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}
                                >
                                    {manualResult.success ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Estado Hacienda</span>
                                                <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2 py-1 rounded-lg">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    <span className="text-[10px] font-black text-emerald-400">{(manualResult.status['ind-estado'] || 'SIN RESPUESTA').toUpperCase()}</span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                                {manualResult.status['respuesta-xml'] ? "La factura ha sido procesada correctamente por los nodos de Hacienda." : "Hacienda ha recibido el documento, pero aún está en proceso de validación."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Error de Consulta</p>
                                            <p className="text-[10px] text-slate-400 leading-tight">{manualResult.error}</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>

                        <AuditLogFeed />
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Clock className="w-3 h-3" /> Monitor de Tráfico v4.4
                            </h3>
                            <Link href="/invoices" className="text-[10px] font-black text-primary hover:text-blue-400 transition-colors uppercase tracking-widest">Ver Todo</Link>
                        </div>

                        <div className="premium-card !p-0 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.03]">
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Referencia</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Destinatario</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Cuantía</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Sentinel Score</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Fujos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <AnimatePresence>
                                            {invoices.map((inv, i) => (
                                                <motion.tr
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    key={inv.id}
                                                    className="hover:bg-white/[0.02] transition-colors group cursor-default"
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <div className="font-mono text-[10px] text-slate-300 tracking-tighter">{inv.consecutivo.slice(-12)}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-xs font-black text-white italic tracking-tight">{inv.receptorNombre || 'Consumer Direct'}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.receptorCedula || '0-0000-0000'}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-xs font-black text-white tracking-widest">¢{parseFloat(inv.totalComprobante).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className={`flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-xl border w-fit ${inv.estado === 'ACEPTADO' ? 'text-emerald-400 bg-emerald-400/5 border-emerald-400/10' :
                                                            inv.estado === 'ENVIADO' ? 'text-blue-400 bg-blue-400/5 border-blue-400/10' :
                                                                'text-amber-500 bg-amber-500/5 border-amber-500/10'
                                                            }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${inv.estado === 'ACEPTADO' ? 'bg-emerald-400 glow-primary' : 'bg-current animate-pulse'
                                                                }`} />
                                                            {inv.estado}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            <button
                                                                disabled={syncingId === inv.id}
                                                                onClick={() => handleSyncStatus(inv.id)}
                                                                className={`w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition-all duration-300 ${syncingId === inv.id ? 'bg-primary/20 cursor-wait' : 'bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400'
                                                                    }`}
                                                                title="Sincronizar con Hacienda"
                                                            >
                                                                {syncingId === inv.id ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <RefreshCw className="w-4 h-4" />}
                                                            </button>
                                                            <Link
                                                                href={`/api/v1/documents/${inv.clave}/pdf`}
                                                                target="_blank"
                                                                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-primary rounded-xl text-slate-400 hover:text-white transition-all duration-300"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                            </Link>
                                                            <Link
                                                                href={`/api/v1/documents/${inv.clave}/xml`}
                                                                download
                                                                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all duration-300"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                        {!loading && invoices.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-32 text-center text-slate-500 text-sm italic font-medium">
                                                    Sistema activo. Preparado para recibir ráfagas v4.4.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
