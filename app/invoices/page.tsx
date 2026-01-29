"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertTriangle, Eye, Download, RefreshCw } from "lucide-react";
import { getLatestInvoices } from "@/app/dashboard/actions/stats"; // Centralizado en dashboard/actions/stats

// Para el historial completo, idealmente haríamos una action con paginación real.
// Por ahora reusaremos getLatestInvoices pero con un limite mayor si fuera necesario,
// o creamos una action ad-hoc aqui.

// El acceso a datos se hace vía Server Actions (actions.ts)

export default function InvoicesPage() {
    // Siendo Client Component para simplicidad de demo, usaremos la misma action
    // En prod: Server Component con SearchParams para paginación.

    // Simularemos el fetch aqui
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    useEffect(() => {
        getLatestInvoices().then(setInvoices);
        // Nota: getLatestInvoices trae solo 5. Para historial completo haríamos otra función.
        // Pero para el demo basta con mostrar las recientes persistidas.
    }, []);

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1e] to-black text-white p-6">

            <header className="max-w-6xl mx-auto flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Historial de Documentos</h1>
                        <p className="text-sm text-muted-foreground">Registro inmutable v4.4</p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Lista */}
                <div className="lg:col-span-2 space-y-4">
                    {invoices.length === 0 && (
                        <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-muted-foreground">
                            No hay facturas registradas aún.
                        </div>
                    )}

                    {invoices.map((inv) => (
                        <div
                            key={inv.id}
                            onClick={() => setSelectedInvoice(inv)}
                            className={`glass-card p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${selectedInvoice?.id === inv.id ? 'border-primary bg-white/5' : 'border-white/5 hover:border-white/20'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${inv.estado === 'ENVIADO' || inv.estado === 'ACEPTADO'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">{inv.consecutivo}</h3>
                                    <p className="text-xs text-muted-foreground">{inv.receptorNombre || 'Cliente Contado'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-bold">¢{parseFloat(inv.totalComprobante).toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detalle */}
                <div className="lg:col-span-1">
                    {selectedInvoice ? (
                        <div className="glass-card p-6 rounded-2xl sticky top-6 space-y-6 animate-in slide-in-from-right-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Factura Electrónica</span>
                                    <h2 className="text-xl font-bold mt-1 text-primary break-all">{selectedInvoice.consecutivo}</h2>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-bold ${selectedInvoice.estado === 'ENVIADO' || selectedInvoice.estado === 'ACEPTADO'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {selectedInvoice.estado}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Clave</span>
                                        <span className="font-mono text-xs max-w-[150px] truncate" title={selectedInvoice.clave}>{selectedInvoice.clave}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Emisor</span>
                                        <span className="text-white">{selectedInvoice.emisorNombre}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Receptor</span>
                                        <span className="text-white">{selectedInvoice.receptorNombre || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-white/10">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>¢{parseFloat(selectedInvoice.totalVenta).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Impuesto</span>
                                        <span>¢{parseFloat(selectedInvoice.totalImpuesto).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-emerald-400 pt-2">
                                        <span>Total</span>
                                        <span>¢{parseFloat(selectedInvoice.totalComprobante).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-6">
                                    <button
                                        onClick={() => {
                                            const win = window.open("", "_blank");
                                            if (win) {
                                                win.document.write(`<pre>${selectedInvoice.xmlFirmado.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`);
                                                win.document.title = `XML - ${selectedInvoice.consecutivo}`;
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 bg-secondary hover:bg-white/10 p-2 rounded-lg text-xs transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Ver XML
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const user = prompt("Hacienda User:");
                                            const pass = prompt("Hacienda Pass:");
                                            if (user && pass) {
                                                const { checkInvoiceStatus } = await import("@/app/actions");
                                                const res = await checkInvoiceStatus(selectedInvoice.id, { user, pass });
                                                if (res.success) {
                                                    alert(`Estado actualizado: ${res.status}`);
                                                    location.reload();
                                                } else {
                                                    alert(`Error: ${res.error}`);
                                                }
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 p-2 rounded-lg text-xs transition-colors text-white"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Sincronizar
                                    </button>
                                </div>

                                <button
                                    onClick={async () => {
                                        const res = await fetch(`/api/v1/documents/${selectedInvoice.clave}/pdf`);
                                        const blob = await res.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `Factura-${selectedInvoice.clave.substring(0, 10)}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                    }}
                                    className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 p-4 rounded-xl text-sm font-bold transition-all text-white shadow-[0_10px_30px_rgba(59,130,246,0.3)]"
                                >
                                    <Download className="w-5 h-5" />
                                    DESCARGAR PDF (REPRESENTACIÓN GRÁFICA)
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 border border-dashed border-white/10 rounded-2xl bg-white/5">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm text-center">Selecciona una factura para ver sus detalles</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
