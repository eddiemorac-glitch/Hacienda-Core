"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Shield,
    Zap,
    ShieldCheck,
    Rocket,
    Crown,
    Gem,
    Play,
    AlertTriangle,
    CheckCircle2,
    Terminal,
    Lock,
    Cpu
} from "lucide-react";
import { processDocument } from "@/app/actions";

/**
 * [SENTINEL PLAYGROUND] - Subscription Logic Validator
 * Allows real-time testing of plan restrictions (Quota, Types, API).
 */

const TEST_CARDS = [
    {
        id: 'STARTER',
        title: 'Starter Profile',
        icon: <Rocket className="w-5 h-5 text-blue-400" />,
        quota: '50 Docs/mo',
        perks: ['Solo Factura (FE)', 'Sin Acceso API'],
        email: 'starter@test.com'
    },
    {
        id: 'BUSINESS',
        title: 'Business Profile',
        icon: <Crown className="w-5 h-5 text-primary" />,
        quota: 'Ilimitado',
        perks: ['FE + REP + FEC', 'Dashboard Full'],
        email: 'business@test.com'
    },
    {
        id: 'ENTERPRISE',
        title: 'Enterprise Profile',
        icon: <Gem className="w-5 h-5 text-amber-500" />,
        quota: 'Ilimitado',
        perks: ['Acceso API Total', 'Cloud VPC'],
        email: 'enterprise@test.com'
    }
];

export default function PlaygroundPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const testFeature = async (plan: string, type: 'FE' | 'REP' | 'FEC') => {
        setLoading(true);
        setStatus({ message: `Simulando emisión de ${type} para plan ${plan}...`, type: 'info' });

        try {
            // This is a simulation using the server actions
            // In a real test, you'd log in as the specific user
            const mockFormData = new FormData();
            mockFormData.append('pin', '1234');

            const res = await processDocument(mockFormData, {
                claveStr: "",
                consecutivoStr: "",
                fechaEmision: new Date(),
                emisor: {
                    nombre: "QA TEST",
                    tipoIdentificacion: "02",
                    numeroIdentificacion: "3101000000",
                    correo: "test@qa.com"
                },
                receptor: {
                    nombre: "RECEPTOR TEST",
                    tipoIdentificacion: "01",
                    numeroIdentificacion: "111111111",
                    correo: "receptor@test.com"
                },
                condicionVenta: "01",
                medioPago: ["01"],
                detalles: [{
                    numeroLinea: 1,
                    codigoCabys: "8314100000000",
                    cantidad: 1,
                    unidadMedida: "Unid",
                    detalle: "Test Item",
                    precioUnitario: 1,
                    montoTotal: 1,
                    subTotal: 1,
                    montoTotalLinea: 1.13,
                    impuesto: { codigo: "01", codigoTarifa: "08", tarifa: 13, monto: 0.13 }
                }],
                resumen: {
                    codigoMoneda: "CRC",
                    totalVenta: 1,
                    totalImpuesto: 0.13,
                    totalComprobante: 1.13,
                    totalDescuentos: 0,
                    totalVentaNeta: 1,
                    totalGravado: 1,
                    totalExento: 0,
                    totalExonerado: 0,
                    totalServiciosGravados: 0,
                    totalServiciosExentos: 0,
                    totalServiciosExonerados: 0,
                    totalMercanciasGravadas: 1,
                    totalMercanciasExentas: 0,
                    totalMercanciasExoneradas: 0
                }
            }, type);

            if (res.status === 'error') {
                setStatus({
                    message: `RESTRICCIÓN DETECTADA: ${res.message}`,
                    type: res.message.includes('RESTRICCIÓN') ? 'warning' : 'danger'
                });
            } else {
                setStatus({ message: `ÉXITO: ${res.message} (Plan: ${plan})`, type: 'success' });
            }
        } catch (e: any) {
            setStatus({ message: `Error de Sistema: ${e.message}`, type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center p-8 sm:p-20 relative overflow-hidden bg-[#020617]">
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <main className="flex flex-col gap-12 w-full max-w-5xl z-10 text-white">
                <header className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                        <Cpu className="w-3 h-3" /> Laboratorio Swarm
                    </div>
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase">Validador de Suscripciones</h1>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Verifique en tiempo real cómo el Sentinel Feature Guard bloquea o permite acciones basadas en el nivel de suscripción.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {TEST_CARDS.map(card => (
                        <div key={card.id} className="premium-card p-8 flex flex-col gap-6 group hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:scale-110 transition-transform">
                                    {card.icon}
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                                    {card.id}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                                <p className="text-xs text-slate-500 mb-4">{card.email}</p>
                                <ul className="space-y-2">
                                    {card.perks.map((p, i) => (
                                        <li key={i} className="flex gap-2 text-[10px] font-medium text-slate-400">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => testFeature(card.id, 'FE')}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    Test Factura (FE) <Play className="w-2" />
                                </button>
                                <button
                                    onClick={() => testFeature(card.id, 'REP')}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    Test Recibo (REP) <Play className="w-2" />
                                </button>
                                <button
                                    onClick={() => testFeature(card.id, 'FEC')}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    Test Compra (FEC) <Play className="w-2" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-10 rounded-[2.5rem] border flex items-center gap-6 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            status.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                status.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-current opacity-10 flex items-center justify-center flex-shrink-0">
                            {status.type === 'success' ? <ShieldCheck className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black uppercase tracking-tighter text-sm">Resultado del Sentinel Analysis</h4>
                            <p className="text-xl font-bold italic tracking-tight">{status.message}</p>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
