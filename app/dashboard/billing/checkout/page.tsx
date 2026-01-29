"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import {
    CreditCard, CheckCircle, Copy, ArrowRight,
    Upload, Clock, ChevronLeft, Loader2, Smartphone,
    Building2, AlertCircle, QrCode, MessageCircle, Info
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    createUpgradeRequest,
    uploadPaymentProof,
    getMyUpgradeRequest
} from "@/app/upgrade-actions";
import { SINPE_INFO, PLAN_HIERARCHY } from "@/lib/payment-config";
import { getDashboardStats } from "../../actions/stats";

/**
 * [CHECKOUT MANUAL SINPE]
 * Flujo de pago via SINPE Móvil con verificación manual
 * Instrucciones claras paso a paso
 */

const PLANS = {
    STARTER: { name: "Starter Node", price: 25000, features: ["50 comprobantes/mes", "Firma digital", "Soporte email"] },
    BUSINESS: { name: "Business Swarm", price: 55000, features: ["Ilimitados", "Multi-usuario", "Soporte 24/7"] },
    ENTERPRISE: { name: "Enterprise Ultra", price: 95000, features: ["Todo Business", "API Robusta", "Consultoría"] }
};

// Wrapper con Suspense para useSearchParams
export default function ManualCheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const planParam = searchParams.get("plan")?.toUpperCase() || "BUSINESS";

    const [step, setStep] = useState<"select" | "instructions" | "upload" | "pending">("select");
    const [selectedPlan, setSelectedPlan] = useState(planParam);
    const [requestId, setRequestId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkingPending, setCheckingPending] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const plan = PLANS[selectedPlan as keyof typeof PLANS] || PLANS.BUSINESS;

    // Check for existing pending request
    useEffect(() => {
        const checkPending = async () => {
            try {
                const pending = await getMyUpgradeRequest();
                const stats = await getDashboardStats();
                const currentPlan = (stats.org?.plan || 'STARTER').toUpperCase() as keyof typeof PLAN_HIERARCHY;

                // Validar que el plan seleccionado en la URL no sea un downgrade
                const requestedRank = PLAN_HIERARCHY[selectedPlan as keyof typeof PLAN_HIERARCHY] || 0;
                const currentRank = PLAN_HIERARCHY[currentPlan] || 0;

                if (requestedRank <= currentRank && !pending) {
                    console.log("🚫 [ANTI-DOWNGRADE] Plan no permitido. Redirigiendo...");
                    window.location.href = "/dashboard/billing";
                    return;
                }

                if (pending) {
                    if (pending.status === 'APPROVED') {
                        // Si ya está aprobado, no tiene sentido estar aquí
                        window.location.href = "/dashboard?upgraded=true";
                        return;
                    }

                    if (pending.status === 'PENDING') {
                        setRequestId(pending.id);
                        setSelectedPlan(pending.requestedPlan);
                        // Si ya tiene comprobante, ir directo a pending
                        if (pending.paymentProof) {
                            setStep("pending");
                        } else {
                            setStep("instructions");
                        }
                    }
                    // Si está REJECTED, dejamos que el usuario vea la pantalla de selección normal
                }
            } catch (e) {
                console.log("No pending request");
            } finally {
                setCheckingPending(false);
            }
        };
        checkPending();
    }, []);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text.replace(/-/g, ""));
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleStartRequest = async () => {
        setLoading(true);
        try {
            const result = await createUpgradeRequest(selectedPlan);
            if (result.success && result.requestId) {
                setRequestId(result.requestId);
                setStep("instructions");
            } else {
                alert(result.error || "Error al crear solicitud");
            }
        } catch (e: any) {
            alert("Error de conexión. Intenta de nuevo.");
        }
        setLoading(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamaño máximo antes de comprimir (ej. 15MB)
        if (file.size > 15 * 1024 * 1024) {
            alert("El archivo es demasiado grande. Por favor usa una imagen de menos de 15MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Crear un canvas para redimensionar y comprimir
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Redimensionar si es muy grande (max 1200px)
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Convertir a base64 comprimido (JPEG calidad 0.7)
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                setProofPreview(compressedBase64);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleUploadProof = async () => {
        if (!proofPreview || !requestId) return;

        setLoading(true);
        try {
            const result = await uploadPaymentProof(requestId, proofPreview);
            if (result.success) {
                setStep("pending");
            } else {
                alert(result.error || "Error al subir comprobante");
            }
        } catch (e) {
            alert("Error de conexión");
        }
        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (checkingPending) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 sm:p-8">
            <div className="max-w-xl w-full">
                {/* Back Link */}
                <Link
                    href="/dashboard/billing"
                    className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 text-sm transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Volver a Facturación
                </Link>

                {/* STEP: Select Plan */}
                {step === "select" && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <Smartphone className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-3">Pago con SINPE Móvil</h1>
                            <p className="text-slate-400">🇨🇷 Paga en colones costarricenses - Activación en menos de 24h</p>
                        </div>

                        <div className="space-y-3">
                            {Object.entries(PLANS).map(([key, p]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedPlan(key)}
                                    className={`w-full p-5 sm:p-6 rounded-2xl border transition-all text-left ${selectedPlan === key
                                        ? 'bg-primary/10 border-primary shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-lg">{p.name}</p>
                                            <p className="text-2xl sm:text-3xl font-black text-primary mt-1">
                                                {formatCurrency(p.price)}
                                                <span className="text-sm text-slate-500 font-normal"> /mes</span>
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {p.features.map((f, i) => (
                                                    <span key={i} className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-slate-400">{f}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === key ? 'border-primary bg-primary' : 'border-white/20'
                                            }`}>
                                            {selectedPlan === key && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleStartRequest}
                            disabled={loading}
                            className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Continuar al Pago
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* STEP: Payment Instructions */}
                {step === "instructions" && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                <Smartphone className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">Instrucciones de Pago</h1>
                            <p className="text-slate-400 text-sm">Sigue estos pasos para completar tu pago</p>
                        </div>

                        {/* Amount Card */}
                        <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 rounded-2xl text-center">
                            <p className="text-sm text-emerald-400 mb-1">Monto Total a Pagar</p>
                            <p className="text-4xl sm:text-5xl font-black text-white">{formatCurrency(plan.price)}</p>
                            <p className="text-xs text-slate-400 mt-2">Plan {selectedPlan} - Mensual</p>
                        </div>

                        {/* Step by Step Instructions */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" />
                                Cómo realizar el pago:
                            </h3>

                            <ol className="space-y-4 text-sm">
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                    <div>
                                        <p className="text-white font-medium">Abre la app de tu banco</p>
                                        <p className="text-slate-400 text-xs mt-0.5">BAC, BCR, Nacional, Popular, Davivienda, etc.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                    <div>
                                        <p className="text-white font-medium">Selecciona "SINPE Móvil"</p>
                                        <p className="text-slate-400 text-xs mt-0.5">También puede aparecer como "Transferir" → "SINPE"</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                    <div>
                                        <p className="text-white font-medium">Ingresa el número de teléfono</p>
                                        <p className="text-slate-400 text-xs mt-0.5">Copia el número abajo ↓</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                                    <div>
                                        <p className="text-white font-medium">Ingresa el monto exacto</p>
                                        <p className="text-slate-400 text-xs mt-0.5">¢{plan.price.toLocaleString()} colones</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">5</span>
                                    <div>
                                        <p className="text-white font-medium">En descripción escribe tu email</p>
                                        <p className="text-slate-400 text-xs mt-0.5">Para identificar tu pago rápidamente</p>
                                    </div>
                                </li>
                            </ol>
                        </div>

                        {/* Payment Details to Copy */}
                        <div className="space-y-3">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Número SINPE</p>
                                    <p className="font-mono font-black text-2xl text-white">{SINPE_INFO.phone}</p>
                                </div>
                                <button
                                    onClick={() => handleCopy(SINPE_INFO.phone, "phone")}
                                    className="p-3 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl transition-colors"
                                >
                                    {copied === "phone" ? (
                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-6 h-6 text-emerald-400" />
                                    )}
                                </button>
                            </div>

                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500">Nombre que aparecerá</p>
                                    <p className="font-semibold text-white">{SINPE_INFO.name}</p>
                                </div>
                                <button
                                    onClick={() => handleCopy(SINPE_INFO.name, "name")}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    {copied === "name" ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-5 h-5 text-slate-400" />
                                    )}
                                </button>
                            </div>

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-amber-200 font-medium">¡Importante!</p>
                                        <p className="text-xs text-amber-200/70 mt-1">
                                            Después de realizar el pago, toma una <strong>captura de pantalla</strong> del comprobante y súbela en el siguiente paso.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep("upload")}
                            className="w-full py-5 bg-primary hover:bg-primary/90 text-white font-black uppercase rounded-2xl flex items-center justify-center gap-3 transition-all"
                        >
                            Ya realicé el pago
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        <p className="text-center text-xs text-slate-500">
                            ¿Necesitas ayuda? Escríbenos a <a href="mailto:soporte@haciendacore.com" className="text-primary hover:underline">soporte@haciendacore.com</a>
                        </p>
                    </div>
                )}

                {/* STEP: Upload Proof */}
                {step === "upload" && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">Subir Comprobante</h1>
                            <p className="text-slate-400 text-sm">Sube la captura de pantalla del pago realizado</p>
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            ref={fileInputRef}
                            className="hidden"
                        />

                        {proofPreview ? (
                            <div className="space-y-4">
                                <div className="relative rounded-2xl overflow-hidden border border-white/10">
                                    <img src={proofPreview} alt="Comprobante" className="w-full" />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-4 right-4 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-xs font-bold hover:bg-black/70 transition-all"
                                    >
                                        Cambiar imagen
                                    </button>
                                </div>

                                <button
                                    onClick={handleUploadProof}
                                    disabled={loading}
                                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Enviar Comprobante
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-16 border-2 border-dashed border-white/10 hover:border-primary/50 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all hover:bg-primary/5"
                            >
                                <Upload className="w-12 h-12 text-slate-500" />
                                <div className="text-center">
                                    <p className="font-bold text-lg">Toca para subir imagen</p>
                                    <p className="text-sm text-slate-500 mt-1">PNG, JPG o captura de pantalla</p>
                                </div>
                            </button>
                        )}

                        <button
                            onClick={() => setStep("instructions")}
                            className="w-full py-3 text-slate-500 hover:text-white text-sm transition-colors"
                        >
                            ← Volver a las instrucciones
                        </button>
                    </div>
                )}

                {/* STEP: Pending Approval */}
                {step === "pending" && (
                    <div className="space-y-8 text-center">
                        <div className="w-24 h-24 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20 animate-pulse">
                            <Clock className="w-12 h-12 text-amber-400" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight mb-3">¡Solicitud Enviada!</h1>
                            <p className="text-slate-400">Tu pago está siendo verificado</p>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                                <span className="text-amber-400 font-bold uppercase text-sm tracking-wider">En Proceso</span>
                            </div>
                            <p className="text-sm text-slate-300">
                                Tu plan será activado en un máximo de <strong className="text-white">24 horas hábiles</strong> después de verificar tu pago.
                            </p>
                            <p className="text-xs text-slate-500 mt-3">
                                Recibirás una notificación por correo cuando esté listo.
                            </p>
                        </div>

                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                            <p className="text-xs text-slate-500 mb-2">Plan Solicitado</p>
                            <p className="font-bold text-xl text-white">{PLANS[selectedPlan as keyof typeof PLANS]?.name}</p>
                            <p className="text-primary font-black text-2xl mt-1">
                                {formatCurrency(PLANS[selectedPlan as keyof typeof PLANS]?.price || 0)}
                                <span className="text-sm text-slate-500 font-normal"> /mes</span>
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href="/dashboard"
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all"
                            >
                                Ir al Dashboard
                            </Link>
                            <a
                                href="mailto:soporte@haciendacore.com"
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Contactar Soporte
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
