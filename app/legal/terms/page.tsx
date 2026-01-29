"use client";

import { ScrollText, ArrowLeft, Scale } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none opacity-50">
                <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al Inicio
                </Link>

                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
                        <ScrollText className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                        Términos y <span className="text-gradient-primary">Condiciones</span>
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Marco legal operativo para el uso de Nova Billing (Sentinel).
                    </p>
                </div>

                <div className="glass-card p-8 md:p-12 rounded-[2rem] space-y-12">

                    {/* Introduction */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm">01</span>
                            Ámbito de Aplicación
                        </h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                Bienvenido a <strong>Nova Billing</strong> (en adelante "La Plataforma"), un servicio de facturación electrónica operado bajo las leyes de la <strong>República de Costa Rica</strong>. Al registrarse y utilizar nuestros servicios, usted acepta incondicionalmente estos Términos y Condiciones.
                            </p>
                            <p>
                                Estos términos regulan el acceso a nuestra infraestructura SaaS (Software as a Service) diseñada para facilitar el cumplimiento de la normativa v4.4 de la Dirección General de Tributación (DGT).
                            </p>
                        </div>
                    </section>

                    {/* Responsibilities */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">02</span>
                            Delimitación de Responsabilidades
                        </h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <h3 className="font-bold text-orange-400 mb-2 flex items-center gap-2">
                                    <Scale className="w-4 h-4" />
                                    Responsabilidad del Usuario
                                </h3>
                                <p className="text-sm">
                                    Nova Billing actúa exclusivamente como proveedor de tecnología intermediario. El usuario final es el único responsable de la veracidad, integridad y exactitud de la información fiscal enviada a Hacienda. No ofrecemos asesoría tributaria.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Subscriptions */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm">03</span>
                            Suscripciones y Pagos
                        </h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                Nuestros servicios se ofrecen bajo un modelo de suscripción mensual o anual.
                            </p>
                            <ul className="space-y-2 list-disc list-inside ml-2">
                                <li><strong>Procesamiento de Pagos:</strong> Utilizamos Stripe como pasarela de pagos segura. No almacenamos datos completos de tarjetas de crédito.</li>
                                <li><strong>Renovación Automática:</strong> Las suscripciones se renuevan automáticamente al final de cada periodo a menos que sean canceladas.</li>
                                <li><strong>Política de Reembolso:</strong> No ofrecemos reembolsos por periodos parciales no utilizados. La cancelación detiene la facturación del siguiente ciclo.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Intellectual Property */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 text-sm">04</span>
                            Propiedad Intelectual
                        </h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                Todo el software, código fuente, algoritmos (incluyendo Swarm Intelligence), diseños e interfaces son propiedad exclusiva de Nova Billing. Se otorga una licencia limitada, no exclusiva e intransferible para el uso de la plataforma durante la vigencia de la suscripción.
                            </p>
                        </div>
                    </section>

                    <div className="pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
                        Versión 1.0 - Actualizado Enero 2026
                    </div>
                </div>
            </div>
        </div>
    );
}
