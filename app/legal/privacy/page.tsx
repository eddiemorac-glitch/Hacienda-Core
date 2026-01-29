"use client";

import { Shield, ArrowLeft, Lock, Eye } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none opacity-50">
                <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al Inicio
                </Link>

                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 mb-4">
                        <Shield className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                        Política de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Privacidad</span>
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Protección de datos y manejo de información sensible según Ley No. 8968.
                    </p>
                </div>

                <div className="glass-card p-8 md:p-12 rounded-[2rem] space-y-12">

                    {/* Data Collection */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 text-sm">01</span>
                            Recolección de Datos
                        </h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                Para la prestación del servicio de facturación electrónica, recolectamos:
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <li className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
                                    <div>
                                        <strong className="text-white block mb-1">Datos de Identificación</strong>
                                        <span className="text-sm">Nombre, Cédula, Correo Electrónico.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Lock className="w-5 h-5 text-emerald-400 mt-0.5" />
                                    <div>
                                        <strong className="text-white block mb-1">Credenciales Criptográficas</strong>
                                        <span className="text-sm">Llave Criptográfica (P12) y PIN para firmar documentos ante Hacienda.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* The Vault - Sensitive Data */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">02</span>
                            Tratamiento de Datos Sensibles (The Vault)
                        </h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                Entendemos la criticidad de su Llave Criptográfica. Nova Billing utiliza una arquitectura de seguridad denominada <strong>"The Vault"</strong>:
                            </p>
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
                                <strong className="block mb-2 text-amber-400 uppercase tracking-widest text-xs">Protocolo de Seguridad</strong>
                                Sus archivos P12 son encriptados en reposo y procesados únicamente en memoria volátil de alta seguridad durante el momento de la firma. Nunca almacenamos su PIN en texto plano accesible por humanos.
                            </div>
                        </div>
                    </section>

                    {/* ARCO Rights */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">03</span>
                            Derechos ARCO (Ley 8968)
                        </h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                De conformidad con la Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley No. 8968), usted tiene derecho a:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <strong className="block text-white mb-1">Acceso</strong>
                                    <span className="text-xs">Ver sus datos</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <strong className="block text-white mb-1">Rectificación</strong>
                                    <span className="text-xs">Corregir errores</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <strong className="block text-white mb-1">Cancelación</strong>
                                    <span className="text-xs">Borrar cuenta</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <strong className="block text-white mb-1">Oposición</strong>
                                    <span className="text-xs">Negar uso</span>
                                </div>
                            </div>
                            <p className="text-sm mt-4">
                                Para ejercer estos derechos, contacte a nuestro Oficial de Cumplimiento.
                            </p>
                        </div>
                    </section>

                    {/* Cookies */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center text-slate-400 text-sm">04</span>
                            Cookies y Tecnologías
                        </h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                Utilizamos cookies técnicas esenciales para mantener su sesión segura y cookies de almacenamiento local para preferencias de interfaz. No vendemos sus datos de navegación a terceros.
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
