"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard,
    CheckCircle2,
    Zap,
    ShieldCheck,
    ChevronLeft,
    Loader2,
    ArrowRight,
    Sparkles,
    Gem,
    Rocket,
    Crown
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "../actions/stats";
import { createPortalSession } from "../../stripe-actions";
import { PLAN_HIERARCHY } from "@/lib/payment-config";

/**
 * [NOVA BILLING STATION v6.0]
 * High-conversion plans and subscription management.
 */

const PLANS_DISPLAY = [
    {
        id: 'starter',
        name: 'Starter Node',
        price: '25,000',
        icon: <Rocket className="w-6 h-6" />,
        color: 'from-blue-500 to-cyan-400',
        features: [
            'Hasta 50 Comprobantes / mes',
            'Firma Digital XAdES-EPES',
            'Soporte por Correo',
            'Dashboard en Tiempo Real'
        ],
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || 'price_starter_mock'
    },
    {
        id: 'business',
        name: 'Business Swarm',
        price: '55,000',
        popular: true,
        icon: <Crown className="w-6 h-6" />,
        color: 'from-primary to-purple-600',
        features: [
            'Comprobantes Ilimitados',
            'Multi-Usuario (Sentinel Access)',
            'Reportes Avanzados de Venta',
            'Soporte Prioritario 24/7'
        ],
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS || 'price_business_mock'
    },
    {
        id: 'enterprise',
        name: 'Enterprise Ultra',
        price: '95,000',
        icon: <Gem className="w-6 h-6" />,
        color: 'from-amber-400 to-orange-500',
        features: [
            'Integración API Robusta',
            'Mantenimiento Dedicado',
            'Seguridad Hardened Alpha',
            'Consultoría en Tributación'
        ],
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_mock'
    }
];

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState('TRIAL');
    const [subStatus, setSubStatus] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const stats = await getDashboardStats();
                setUserPlan(stats.org?.plan || 'TRIAL');
                setSubStatus(stats.org?.subscriptionStatus || null);
            } catch (e) {
                console.error("Load billing failed", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleUpgrade = async (planId: string) => {
        // Redirigir al checkout manual de SINPE en vez de Stripe
        window.location.href = `/dashboard/billing/checkout?plan=${planId}`;
    };

    const handlePortal = async () => {
        setProcessing('portal');
        try {
            const res = await createPortalSession();
            if (res.url) window.location.href = res.url;
            else alert("Primero debe suscribirse a un plan.");
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    return (
        <div className="flex min-h-screen flex-col items-center p-8 sm:p-20 relative overflow-hidden bg-[#020617]">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -mr-96 -mt-96" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] -ml-64 -mb-64" />

            <main className="flex flex-col gap-16 w-full max-w-6xl z-10 text-white">
                <header className="flex flex-col md:flex-row justify-between items-end gap-10">
                    <div className="space-y-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-primary transition-all mb-4">
                            <ChevronLeft className="w-4 h-4" /> Volver al Inicio
                        </Link>
                        <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase">Gestión de Suscripción</h1>
                        <p className="text-slate-400 font-medium max-w-xl">
                            Administre su nivel de potencia dentro de la red Sentinel. Actualice su plan para desbloquear capacidades ilimitadas.
                        </p>
                    </div>

                    <div className="p-8 premium-card !bg-white/[0.02] flex flex-col gap-4">
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${userPlan === 'ENTERPRISE' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                userPlan === 'BUSINESS' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                }`}>
                                {userPlan === 'ENTERPRISE' ? <Gem className="w-7 h-7" /> :
                                    userPlan === 'BUSINESS' ? <Crown className="w-7 h-7" /> :
                                        <Rocket className="w-7 h-7" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tu Plan Actual</p>
                                <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">{userPlan}</h3>
                            </div>
                            <button onClick={handlePortal} className="ml-auto px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-slate-300 border border-white/5 transition-all">
                                {processing === 'portal' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Facturación Stripe'}
                            </button>
                        </div>

                        {/* Subscription Status Badge */}
                        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${subStatus === 'active' || subStatus === 'trialing' ? 'bg-emerald-500' :
                                subStatus === 'past_due' ? 'bg-amber-500' :
                                    'bg-slate-500'
                                }`} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {subStatus === 'active' ? 'Suscripción Activa' :
                                    subStatus === 'trialing' ? 'Período de Prueba' :
                                        subStatus === 'past_due' ? 'Pago Pendiente' :
                                            subStatus === 'canceled' ? 'Cancelada' :
                                                'Sin Suscripción'}
                            </span>
                            {userPlan !== 'STARTER' && (subStatus === 'active' || subStatus === 'trialing') && (
                                <span className="text-[9px] text-emerald-400/60 ml-auto">Acceso Premium Habilitado</span>
                            )}
                        </div>
                    </div>
                </header>

                {/* LOCAL PAYMENT OPTION - Costa Rica */}
                <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                        <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">🇨🇷 Pago Local Costa Rica</h3>
                        <p className="text-sm text-emerald-200/70 mt-1">
                            Paga con <strong>SINPE Móvil</strong> en colones. Activación en menos de 24 horas.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/billing/checkout"
                        className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 shrink-0"
                    >
                        <CreditCard className="w-4 h-4" />
                        Pagar con SINPE
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
                    {PLANS_DISPLAY.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative premium-card p-10 flex flex-col justify-between group h-full ${plan.popular ? 'border-primary shadow-[0_30px_60px_-15px_rgba(59,130,246,0.3)]' : 'border-white/5'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                                    Recomendado
                                </div>
                            )}

                            <div>
                                <div className={`w-14 h-14 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                    {plan.icon}
                                </div>
                                <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className="text-4xl font-black text-white">¢{plan.price}</span>
                                    {plan.price !== 'Custom' && <span className="text-xs font-bold text-slate-500 italic">/ mes + IVA</span>}
                                </div>

                                <ul className="space-y-4 mb-10">
                                    {plan.features.map((feat, fi) => (
                                        <li key={fi} className="flex items-center gap-3 text-xs font-medium text-slate-400">
                                            <div className="w-5 h-5 bg-white/5 rounded-full flex items-center justify-center text-emerald-500 flex-shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </div>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {(() => {
                                const pKey = plan.id.toUpperCase() as keyof typeof PLAN_HIERARCHY;
                                const uKey = userPlan as keyof typeof PLAN_HIERARCHY;
                                const isCurrent = userPlan === pKey;
                                const isLower = PLAN_HIERARCHY[pKey] < (PLAN_HIERARCHY[uKey] || 0);
                                const isDisabled = isCurrent || isLower;

                                return (
                                    <button
                                        onClick={() => handleUpgrade(plan.id)}
                                        disabled={isDisabled}
                                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${isCurrent
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : isLower
                                                    ? 'bg-white/5 text-slate-600 border border-white/5 opacity-50 cursor-not-allowed'
                                                    : plan.popular
                                                        ? 'bg-primary text-white shadow-xl hover:scale-[1.03] active:scale-95'
                                                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                                            } disabled:cursor-default`}
                                    >
                                        {isCurrent ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Plan Actual
                                            </>
                                        ) : isLower ? (
                                            <>
                                                Plan Inferior
                                            </>
                                        ) : (
                                            <>
                                                Elegir Plan
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                );
                            })()}
                        </motion.div>
                    ))}
                </div>

                {/* Secure Trust Badges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/5 pt-20">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Pagos Seguros</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Procesado por Stripe con cifrado de grado bancario AES-256.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Sin Interrupciones</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Actualización instantánea. Sin necesidad de reconfigurar Hacienda.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-amber-500 border border-white/5">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Sentinel AI Shield</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Protección contra errores en ráfagas de facturación de alto volumen.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
