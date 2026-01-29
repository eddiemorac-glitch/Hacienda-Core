"use client";

import { useState, useEffect } from "react";
import {
    Shield, CheckCircle, XCircle, Clock,
    Eye, ChevronLeft, RefreshCw, CreditCard,
    Building2, FileImage
} from "lucide-react";
import Link from "next/link";
import {
    getPendingUpgradeRequests,
    approveUpgradeRequest,
    rejectUpgradeRequest
} from "@/app/upgrade-actions";

/**
 * [ADMIN] Panel de Gestión de Upgrades
 * Permite aprobar/rechazar solicitudes de upgrade con pago manual
 */

export default function AdminUpgradesPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedProof, setSelectedProof] = useState<string | null>(null);

    const loadRequests = async () => {
        setLoading(true);
        const result = await getPendingUpgradeRequests();
        if (Array.isArray(result)) {
            setRequests(result);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (id: string) => {
        if (!confirm("¿Confirmas aprobar esta solicitud y activar el plan?")) return;

        setProcessing(id);
        const result = await approveUpgradeRequest(id, "Aprobado por admin");
        if (result.success) {
            await loadRequests();
        } else {
            alert(result.error);
        }
        setProcessing(null);
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Razón del rechazo:");
        if (!reason) return;

        setProcessing(id);
        const result = await rejectUpgradeRequest(id, reason);
        if (result.success) {
            await loadRequests();
        } else {
            alert(result.error);
        }
        setProcessing(null);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-CR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                                <Shield className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tight">Gestión de Upgrades</h1>
                                <p className="text-xs text-slate-500">Panel Administrativo - Verificación Manual de Pagos</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={loadRequests}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-amber-400" />
                            <span className="text-3xl font-black">{requests.length}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Pendientes</p>
                    </div>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-emerald-400" />
                            <span className="text-3xl font-black">
                                {formatCurrency(requests.reduce((sum, r) => sum + r.amountCRC, 0))}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Total Pendiente</p>
                    </div>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-blue-400" />
                            <span className="text-3xl font-black">{new Set(requests.map(r => r.orgId)).size}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Empresas</p>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">No hay solicitudes pendientes</p>
                        <p className="text-sm mt-2">Todas las solicitudes han sido procesadas</p>
                    </div>
                ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Organización</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Solicitado</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Método</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Comprobante</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-semibold text-white">{req.orgName}</p>
                                                <p className="text-xs text-slate-500">{req.orgCedula}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500 line-through">{req.currentPlan}</span>
                                                <span className="text-white">→</span>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${req.requestedPlan === 'ENTERPRISE' ? 'bg-amber-500/20 text-amber-400' :
                                                        req.requestedPlan === 'BUSINESS' ? 'bg-indigo-500/20 text-indigo-400' :
                                                            'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {req.requestedPlan}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono font-bold text-emerald-400">
                                                {formatCurrency(req.amountCRC)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-white/5 rounded-lg text-xs">
                                                {req.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {req.paymentProof ? (
                                                <button
                                                    onClick={() => setSelectedProof(req.paymentProof)}
                                                    className="flex items-center gap-2 text-primary hover:text-primary/80 text-xs"
                                                >
                                                    <FileImage className="w-4 h-4" />
                                                    Ver Comprobante
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-500">Sin comprobante</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-slate-400">
                                            {formatDate(req.createdAt)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    disabled={processing === req.id}
                                                    className="flex items-center gap-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Aprobar
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    disabled={processing === req.id}
                                                    className="flex items-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Rechazar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal for viewing proof */}
            {selectedProof && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
                    onClick={() => setSelectedProof(null)}
                >
                    <div className="max-w-4xl max-h-[90vh] overflow-auto bg-slate-900 rounded-2xl p-4 border border-white/10">
                        <img
                            src={selectedProof}
                            alt="Comprobante de pago"
                            className="max-w-full rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
