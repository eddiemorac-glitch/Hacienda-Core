"use client";

import { useState, useEffect } from "react";
import {
    Building2, Users, FileText, Search,
    Filter, ArrowUpDown, ChevronLeft,
    MoreHorizontal, Shield, ExternalLink,
    Clock, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { getAllOrganizations } from "../actions";

/**
 * [SENTINEL - ORGANIZATIONS MASTER LIST]
 * Enterprise management for all client organizations.
 */

export default function AdminOrgsPage() {
    const [orgs, setOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const loadOrgs = async () => {
        setLoading(true);
        try {
            const data = await getAllOrganizations();
            setOrgs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrgs();
    }, []);

    const filteredOrgs = orgs.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.cedula.includes(searchTerm)
    );

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter">ORGANIZACIONES</h1>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Master Client Directory</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nombre o cédula..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <button onClick={loadOrgs} className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Orgs Table */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Información</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan & Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Usuarios</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Docs</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ambiente</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredOrgs.map(org => (
                                <tr key={org.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center font-black text-slate-500">
                                                {org.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-200">{org.name}</p>
                                                <p className="text-[10px] font-mono text-slate-500">{org.cedula}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block w-fit ${org.plan === 'ENTERPRISE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                    org.plan === 'BUSINESS' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                                                        'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                                }`}>
                                                {org.plan}
                                            </span>
                                            <span className="text-[9px] text-slate-500 font-medium italic">
                                                {org.subscriptionStatus || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center font-medium text-slate-400">{org._count.users}</td>
                                    <td className="p-6 text-center font-medium text-slate-400">{org._count.invoices}</td>
                                    <td className="p-6">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${org.haciendaEnv === 'production' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-status-amber/10 text-amber-500'
                                            }`}>
                                            {org.haciendaEnv}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                            <MoreHorizontal className="w-5 h-5 text-slate-600" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
