"use client";

import { useState, useEffect } from "react";
import {
    Shield, Building2, Users, FileText,
    ArrowUpRight, Clock, Activity, ExternalLink,
    TrendingUp, AlertTriangle, RefreshCw, CreditCard
} from "lucide-react";
import Link from "next/link";
import { getGlobalAdminStats } from "./actions";

/**
 * [SENTINEL - SUPERADMIN COMMAND CENTER]
 * Central monitoring hub for the entire platform.
 */

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await getGlobalAdminStats();
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-white p-8">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">
                            <Activity className="w-3 h-3" /> Sistema Nominal Pro
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-4">
                            COMMAND CENTER
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Panel de Control Maestro - HaciendaCore Sentinel</p>
                    </div>

                    <button
                        onClick={loadStats}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> RECARGAR MÉTRICAS
                    </button>
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        title="Organizaciones"
                        value={stats?.totalOrgs}
                        icon={<Building2 className="text-blue-400" />}
                        subtitle="Clientes Activos"
                    />
                    <KpiCard
                        title="Documentos"
                        value={stats?.totalInvoices}
                        icon={<FileText className="text-emerald-400" />}
                        subtitle="Total Histórico"
                    />
                    <KpiCard
                        title="Facturación Global"
                        value={formatCurrency(stats?.totalRevenue)}
                        icon={<TrendingUp className="text-indigo-400" />}
                        subtitle="Estimado"
                    />
                    <KpiCard
                        title="Upgrades Pendientes"
                        value={stats?.pendingUpgrades}
                        icon={<Clock className="text-amber-400" />}
                        subtitle="Acción Requerida"
                        highlight={stats?.pendingUpgrades > 0}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Recent Activity */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="premium-card p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-primary" /> Tráfico Reciente
                                </h3>
                                <Link href="/admin/upgrades" className="text-[10px] font-black text-primary hover:underline">
                                    VER TODOS
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {stats?.recentInvoices.map((inv: any) => (
                                    <div key={inv.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-slate-500 text-xs text-center leading-tight">
                                                DOC
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{inv.organization.name}</p>
                                                <p className="text-[10px] font-mono text-slate-500">{inv.clave.substring(0, 20)}...</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-emerald-400">{formatCurrency(inv.totalComprobante)}</p>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${inv.estado === 'ACEPTADO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {inv.estado}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions & Monitoring */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="premium-card p-8 bg-indigo-500/5 border-indigo-500/20">
                            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Accesos Rápidos</h3>
                            <div className="flex flex-col gap-3">
                                <AdminLink href="/admin/upgrades" label="Aprobar Pagos" icon={<CreditCard className="w-4 h-4" />} count={stats?.pendingUpgrades} />
                                <AdminLink href="/dashboard/qa/playground" label="Laboratorio QA" icon={<Shield className="w-4 h-4" />} />
                                <AdminLink href="/dashboard/api" label="Visor de API Keys" icon={<Users className="w-4 h-4" />} />
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/20">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Hacienda Health Monitor</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-bold text-slate-500 tracking-tight">API Estabilidad</span>
                                    <span className="text-xs font-black text-white">99.8%</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[99.8%]" />
                                </div>
                                <p className="text-[9px] text-slate-500 italic">No se reportan caídas en la DGT en los últimos 30 mins.</p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, subtitle, highlight }: any) {
    return (
        <div className={`premium-card p-6 border transition-all ${highlight ? 'border-amber-500/50 bg-amber-500/5 scale-[1.02]' : 'border-white/5'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    {icon}
                </div>
                {highlight && <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</h3>
            <p className="text-3xl font-black text-white tracking-tighter mb-2">{value}</p>
            <p className="text-[10px] font-medium text-slate-500">{subtitle}</p>
        </div>
    );
}

function AdminLink({ href, label, icon, count }: any) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/5 transition-all group"
        >
            <div className="flex items-center gap-3">
                <div className="text-slate-400 group-hover:text-white transition-colors">
                    {icon}
                </div>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white">{label}</span>
            </div>
            {count > 0 ? (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-lg">
                    {count}
                </span>
            ) : (
                <ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-primary transition-all" />
            )}
        </Link>
    );
}

