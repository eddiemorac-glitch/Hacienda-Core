"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { processDocument, DocumentState } from "@/app/actions";
import {
    ShieldCheck, Send, Loader2, FileCheck, AlertCircle,
    Trash2, PlusCircle, CreditCard, ShoppingBag,
    Receipt, Download, Check, Zap, RotateCcw,
    User, Mail, Hash, Calendar, DollarSign,
    ChevronRight, ArrowLeft, Info, Settings,
    Cpu, Globe, Lock, Briefcase
} from "lucide-react";
import Link from "next/link";
import { CabysSearch } from "./cabys-search";
import { CabysItem } from "@/lib/hacienda/cabys-data";
import { calcularLinea, redondear } from "@/lib/utils/calculations";
import { useFrontendSwarm } from "@/hooks/use-swarm";

/**
 * [NOVA ORDER SYSTEM v6.0]
 * Focused on Clarity, Structure, and Logical Flow.
 * Prioritizes user guidance over visual intensity.
 */

// [HELPER] Determinar tipo de identificación por longitud de cédula
function getTipoIdentificacion(cedula: string): string {
    const digits = cedula.replace(/\D/g, ''); // Solo dígitos
    if (digits.length === 9) return '01'; // Física
    if (digits.length === 10) return '02'; // Jurídica
    if (digits.length >= 11 && digits.length <= 12) return '03'; // DIMEX
    if (digits.length === 10 && digits.startsWith('40')) return '04'; // NITE (caso especial)
    return '01'; // Default física
}

type DocType = 'FE' | 'REP' | 'FEC';

export default function InvoiceForm() {
    const { isHydrated } = useFrontendSwarm();
    const [docType, setDocType] = useState<DocType>('FE');
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DocumentState | null>(null);
    const [hasSavedConfig, setHasSavedConfig] = useState(false);

    // Form States
    const [clientData, setClientData] = useState({ nombre: "", cedula: "", correo: "" });
    const [authData, setAuthData] = useState({ haciendaUser: "", haciendaPass: "", pin: "" });
    const [condicionVenta, setCondicionVenta] = useState('01');
    const [plazoCredito, setPlazoCredito] = useState('30');
    const [p12File, setP12File] = useState<File | null>(null);

    // Line Items
    interface LineItem {
        id: string;
        cabys: CabysItem | null;
        cantidad: number;
        precio: number;
        isIvi: boolean;
        detalle: string;
    }

    const [lines, setLines] = useState<LineItem[]>([
        { id: Math.random().toString(), cabys: null, cantidad: 1, precio: 0, isIvi: true, detalle: '' }
    ]);

    // REP Data
    const [repData, setRepData] = useState({
        montoPago: 0,
        referenciaClave: "",
        referenciaFecha: new Date().toISOString().split('T')[0]
    });

    // [FIX] Estado para datos del emisor desde la organización
    const [emisorData, setEmisorData] = useState({
        nombre: "",
        tipoIdentificacion: "02",
        numeroIdentificacion: ""
    });

    useEffect(() => {
        async function fetchConfig() {
            try {
                const { getDashboardStats } = await import("@/app/dashboard/actions/stats");
                const stats = await getDashboardStats();
                setHasSavedConfig(!!stats.hasHaciendaConfig);

                // [FIX] Cargar datos del emisor desde la organización
                if (stats.org) {
                    const cedula = (stats.org as any).cedula || "";
                    setEmisorData({
                        nombre: (stats.org as any).name || "",
                        tipoIdentificacion: getTipoIdentificacion(cedula),
                        numeroIdentificacion: cedula
                    });
                }
            } catch (e) { console.error(e); }
        }
        fetchConfig();
    }, []);

    const totals = useMemo(() => {
        if (docType === 'REP') return { subTotal: 0, impuesto: 0, total: repData.montoPago };
        let subTotal = 0; let imp = 0; let total = 0;
        lines.forEach(line => {
            if (line.cabys) {
                const calc = calcularLinea(line.cantidad, line.precio, line.isIvi, line.cabys.impuesto);
                subTotal += calc.subTotal;
                imp += calc.montoImpuesto;
                total += calc.montoTotalLinea;
            }
        });
        return { subTotal: redondear(subTotal), impuesto: redondear(imp), total: redondear(total) };
    }, [lines, docType, repData.montoPago]);

    const handleProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formPayload = new FormData();
            if (p12File) formPayload.append("p12", p12File);
            formPayload.append("pin", authData.pin);
            formPayload.append("haciendaUser", authData.haciendaUser);
            formPayload.append("haciendaPass", authData.haciendaPass);

            let docPayload: any = {};
            // Simplified for logic retention
            if (docType === 'FE' || docType === 'FEC') {
                const detalles = lines.map((l, i) => {
                    const calc = calcularLinea(l.cantidad, l.precio, l.isIvi, l.cabys?.impuesto || 0);
                    return {
                        numeroLinea: i + 1,
                        codigoCabys: l.cabys?.codigo || "0000000000000",
                        cantidad: l.cantidad,
                        unidadMedida: "Unid",
                        detalle: l.detalle || l.cabys?.descripcion || "Detalle",
                        precioUnitario: calc.precioUnitarioBase,
                        montoTotal: calc.subTotal,
                        subTotal: calc.subTotal,
                        impuesto: { codigo: "01", codigoTarifa: "08", tarifa: (l.cabys?.impuesto || 0) * 100, monto: calc.montoImpuesto },
                        montoTotalLinea: calc.montoTotalLinea
                    };
                });
                // [FIX] Ahora usa datos reales de la organización
                docPayload = {
                    emisor: emisorData,
                    receptor: { nombre: clientData.nombre, tipoIdentificacion: getTipoIdentificacion(clientData.cedula), numeroIdentificacion: clientData.cedula, correo: clientData.correo },
                    detalles,
                    condicionVenta,
                    plazoCredito,
                    medioPago: ['01'], // 01=Efectivo, 02=Tarjeta, 03=Cheque, etc.
                    resumen: { codigoMoneda: "CRC", totalVenta: totals.subTotal, totalImpuesto: totals.impuesto, totalComprobante: totals.total, totalVentaNeta: totals.subTotal, totalDescuentos: 0, totalGravado: totals.subTotal, totalExento: 0, totalExonerado: 0 }
                };
            } else if (docType === 'REP') {
                // [FIX] Ahora usa datos reales de la organización
                docPayload = {
                    emisor: emisorData,
                    receptor: { nombre: clientData.nombre, tipoIdentificacion: getTipoIdentificacion(clientData.cedula), numeroIdentificacion: clientData.cedula },
                    montoPago: repData.montoPago,
                    codigoMoneda: "CRC",
                    referencia: { tipoDoc: "01", numero: repData.referenciaClave, fechaEmision: new Date(repData.referenciaFecha), codigo: "00", razon: "Pago de factura" }
                };
            }

            const res = await processDocument(formPayload, docPayload, docType);
            setResult(res);
        } catch (err: any) {
            setResult({ status: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isHydrated) return null;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-12 pb-32">

            {/* Header: Type Selection */}
            <header className="space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <div className="w-8 h-1 bg-primary rounded-full" />
                    Nueva Transacción Electrónica
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Emisión de Documentos</h1>
                        <p className="text-slate-500 mt-2">Seleccione el tipo de comprobante que desea generar hoy.</p>
                    </div>
                    <div className="bg-white/5 p-1 rounded-2xl flex border border-white/5">
                        {[
                            { id: 'FE', label: 'Factura Electrónica' },
                            { id: 'REP', label: 'Recibo de Pago' },
                            { id: 'FEC', label: 'Compra Electrónica' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setDocType(t.id as DocType)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${docType === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <form onSubmit={handleProcess} className="space-y-8">
                <AnimatePresence mode="wait">
                    {step === 1 && !result && (
                        <motion.div
                            key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                            className="space-y-8"
                        >
                            {/* SECTION 1: IDENTITY */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">01</div>
                                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Información del Receptor</h2>
                                    <div className="h-px bg-white/5 flex-1" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre o Razón Social</label>
                                        <input required value={clientData.nombre} onChange={e => setClientData({ ...clientData, nombre: e.target.value })} placeholder="Ej: Juan Pérez" className="modern-input" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Número de Identificación</label>
                                        <input required value={clientData.cedula} onChange={e => setClientData({ ...clientData, cedula: e.target.value })} placeholder="1-1111-1111" className="modern-input font-mono" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Correo Electrónico</label>
                                        <input type="email" value={clientData.correo} onChange={e => setClientData({ ...clientData, correo: e.target.value })} placeholder="cliente@correo.com" className="modern-input" />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: SERVICES / LINES */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">02</div>
                                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Detalle de los Servicios</h2>
                                    <div className="h-px bg-white/5 flex-1" />
                                    <button
                                        type="button"
                                        onClick={() => setLines([...lines, { id: Math.random().toString(), cabys: null, cantidad: 1, precio: 0, isIvi: true, detalle: '' }])}
                                        className="bg-white/5 hover:bg-white/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
                                    >
                                        <PlusCircle className="w-4 h-4" /> Agregar Item
                                    </button>
                                </div>

                                {docType === 'REP' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Monto Pago (CRC)</label>
                                            <input type="number" value={repData.montoPago || ""} onChange={e => setRepData({ ...repData, montoPago: parseFloat(e.target.value) || 0 })} className="modern-input text-xl font-bold text-success border-success/20 bg-success/5" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Clave Original</label>
                                            <input value={repData.referenciaClave} onChange={e => setRepData({ ...repData, referenciaClave: e.target.value })} placeholder="Clave de 50 dígitos..." className="modern-input font-mono" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Table Flow */}
                                        <div className="hidden lg:grid grid-cols-12 gap-6 px-10 mb-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                            <div className="col-span-6">Búsqueda de Catálogo (CAByS)</div>
                                            <div className="col-span-1 text-center">Cant.</div>
                                            <div className="col-span-2 text-right">Unitario ¢</div>
                                            <div className="col-span-2 text-right">Total ¢</div>
                                        </div>

                                        {lines.map((l, i) => {
                                            const lineTotal = l.cabys ? calcularLinea(l.cantidad, l.precio, l.isIvi, l.cabys.impuesto).montoTotalLinea : 0;
                                            return (
                                                <div key={l.id} className="grid grid-cols-12 gap-6 items-center p-6 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/5 group transition-all">
                                                    <div className="col-span-12 lg:col-span-6 space-y-3">
                                                        <CabysSearch onSelect={item => setLines(prev => prev.map(x => x.id === l.id ? { ...x, cabys: item } : x))} />
                                                        <input
                                                            placeholder="Descripción personalizada para este concepto..."
                                                            value={l.detalle}
                                                            onChange={e => setLines(prev => prev.map(x => x.id === l.id ? { ...x, detalle: e.target.value } : x))}
                                                            className="w-full bg-transparent border-b border-white/5 py-1 text-[11px] font-bold text-slate-500 outline-none focus:border-primary/50 focus:text-slate-300 transition-all"
                                                        />
                                                    </div>
                                                    <div className="col-span-4 lg:col-span-1">
                                                        <label className="lg:hidden text-[9px] font-black text-slate-600 block mb-1">CANT.</label>
                                                        <input type="number" value={l.cantidad} onChange={e => setLines(prev => prev.map(x => x.id === l.id ? { ...x, cantidad: parseFloat(e.target.value) || 0 } : x))} className="modern-input text-center px-0 font-black h-12" />
                                                    </div>
                                                    <div className="col-span-8 lg:col-span-2">
                                                        <label className="lg:hidden text-[9px] font-black text-slate-600 block mb-1">PRECIO ¢</label>
                                                        <input type="number" value={l.precio} onChange={e => setLines(prev => prev.map(x => x.id === l.id ? { ...x, precio: parseFloat(e.target.value) || 0 } : x))} className="modern-input text-right font-mono font-black h-12 text-emerald-400" />
                                                    </div>
                                                    <div className="col-span-10 lg:col-span-2 text-right pt-2 border-l border-white/5 pl-6 hidden lg:block">
                                                        <p className="text-[7px] font-black text-slate-600 uppercase mb-1">Línea Total</p>
                                                        <span className="text-base font-black text-white italic tracking-tighter">¢{redondear(lineTotal).toLocaleString()}</span>
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1 flex justify-end">
                                                        <button onClick={() => setLines(lines.filter(x => x.id !== l.id))} className="p-3 text-slate-600 hover:text-red-500 transition-all bg-white/5 rounded-xl hover:bg-red-500/10 active:scale-90">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* SECTION 3: TOTALS & SUMMARY */}
                            <div className="flex flex-col lg:flex-row gap-8">
                                <div className="flex-1 bg-[#0A0F1E] border border-white/5 rounded-3xl p-8 space-y-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Settings className="w-3.5 h-3.5 text-primary" /> 03. Configuración de Pago
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Condición de Venta</label>
                                            <select value={condicionVenta} onChange={e => setCondicionVenta(e.target.value)} className="modern-input">
                                                <option value="01">Contado</option>
                                                <option value="02">Crédito</option>
                                            </select>
                                        </div>
                                        {condicionVenta === '02' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Plazo (días)</label>
                                                <input type="number" value={plazoCredito} onChange={e => setPlazoCredito(e.target.value)} className="modern-input" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-4 space-y-3">
                                        <div className="flex justify-between items-center text-sm font-medium">
                                            <span className="text-slate-500">Monto Subtotal</span>
                                            <span className="text-white">¢{totals.subTotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-medium">
                                            <span className="text-slate-500">Impuestos Aplicados</span>
                                            <span className="text-white">¢{totals.impuesto.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:w-[400px] bg-primary rounded-3xl p-8 flex flex-col justify-center items-center text-center shadow-2xl shadow-primary/20">
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Total del Comprobante</span>
                                    <h2 className="text-5xl font-black text-white italic tracking-tighter">¢{totals.total.toLocaleString()}</h2>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (docType !== 'REP' && lines.every(l => !l.cabys)) return alert("Debe elegir un servicio.");
                                            if (!clientData.cedula || !clientData.nombre) return alert("Complete los datos del cliente.");
                                            setStep(2);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="mt-8 w-full bg-white text-primary rounded-2xl py-4 font-black uppercase tracking-widest text-[11px] hover:scale-[1.03] transition-all flex items-center justify-center gap-3"
                                    >
                                        CONTINUAR A FIRMA <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && !result && (
                        <motion.div
                            key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="max-w-3xl mx-auto space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                                    <ShieldCheck className="w-10 h-10 text-primary" />
                                </div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Autorización de Hacienda</h1>
                                <p className="text-slate-500 max-w-sm mx-auto">Procederemos con el firmado digital XAdES-EPES y el envío inmediato.</p>
                            </div>

                            <div className="bg-[#0A0F1E] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
                                {hasSavedConfig && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex items-center gap-4">
                                        <Zap className="w-5 h-5 text-emerald-500" />
                                        <p className="text-xs text-emerald-500/80 font-medium">Configuración cargada de la bóveda segura. Todo listo para transmitir.</p>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Certificado Criptográfico (.p12)</label>
                                        <input type="file" onChange={e => setP12File(e.target.files?.[0] || null)} className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-xs text-slate-400 cursor-pointer" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">PIN de Seguridad (4 dígitos)</label>
                                            <input type="password" value={authData.pin} onChange={e => setAuthData({ ...authData, pin: e.target.value })} placeholder="••••" className="modern-input text-center text-xl tracking-[0.5em]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password API de Hacienda</label>
                                            <input type="password" value={authData.haciendaPass} onChange={e => setAuthData({ ...authData, haciendaPass: e.target.value })} placeholder="••••••••" className="modern-input" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Usuario del Sistema (Hacienda)</label>
                                        <input value={authData.haciendaUser} onChange={e => setAuthData({ ...authData, haciendaUser: e.target.value })} placeholder="cpf-01-xxxx-xxxxxx" className="modern-input font-mono" />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-white/5">
                                    <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 text-xs font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest">Atrás</button>
                                    <button
                                        type="submit" disabled={isLoading}
                                        className="flex-[2] bg-success text-white py-4 rounded-2xl font-black uppercase text-[11px] transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-success/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {isLoading ? 'Transmitiendo...' : 'Firmar y Enviar Documento'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {result && (
                        <motion.div
                            key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="max-w-2xl mx-auto py-12"
                        >
                            <div className={`bg-[#0A0F1E] border ${result.status === 'success' ? 'border-success/30' : 'border-red-500/30'} rounded-[3rem] overflow-hidden shadow-2xl`}>
                                <div className={`h-1.5 w-full ${result.status === 'success' ? 'bg-success' : 'bg-red-500'}`} />
                                <div className="p-16 text-center space-y-10">
                                    <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto ${result.status === 'success' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-500'}`}>
                                        {result.status === 'success' ? <FileCheck className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-bold text-white tracking-tight">{result.status === 'success' ? '¡Documento Enviado!' : 'Error de Proceso'}</h2>
                                        <p className="text-slate-400 mt-4 text-lg font-medium">{result.message}</p>
                                    </div>

                                    {result.clave && (
                                        <div className="space-y-8">
                                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-left">
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Clave de Seguridad de Hacienda</p>
                                                <p className="text-sm font-mono text-success break-all leading-relaxed">{result.clave}</p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <button
                                                    onClick={async () => {
                                                        if (!result.clave) return;
                                                        const res = await fetch(`/api/v1/documents/${result.clave}/pdf`);
                                                        const blob = await res.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `Factura-${result.clave.substring(0, 10)}.pdf`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        window.URL.revokeObjectURL(url);
                                                    }}
                                                    className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                                                >
                                                    <Download className="w-5 h-5" /> DESCARGAR PDF
                                                </button>
                                                <button onClick={() => window.location.reload()} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/10">
                                                    NUEVA FACTURA
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!result.clave && (
                                        <button onClick={() => setResult(null)} className="px-12 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/10">
                                            VOLVER A INTENTAR
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
}
