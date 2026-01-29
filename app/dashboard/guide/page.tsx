"use client";

import { motion } from "framer-motion";
import {
    HelpCircle,
    BookOpen,
    PlayCircle,
    CheckCircle2,
    ShieldCheck,
    Settings,
    PlusCircle,
    History,
    FileText,
    Key,
    UserCircle,
    ArrowRight,
    Zap,
    Cpu,
    Globe,
    ChevronRight,
    Search,
    Monitor
} from "lucide-react";
import Link from "next/link";

/**
 * [NOVA ACADEMY - USER GUIDE v1.0]
 * Interactive and visual guide for non-technical users.
 */

const GUIDE_STEPS = [
    {
        id: "setup",
        title: "Paso 1: Configuración de Identidad",
        icon: <Key className="w-6 h-6" />,
        color: "bg-blue-500",
        description: "Para facturar legalmente, el sistema necesita su Llave Criptográfica (.p12) emitida por Hacienda (ATV).",
        details: [
            "Vaya a 'Ajustes' en el menú lateral.",
            "Suba su archivo .p12 y escriba el PIN de 4 dígitos.",
            "Ingrese su Usuario y Contraseña de API (generados en el portal ATV).",
            "Guarde los cambios. El sistema verificará la conexión automáticamente."
        ]
    },
    {
        id: "products",
        title: "Paso 2: Inventario & CAByS",
        icon: <Search className="w-6 h-6" />,
        color: "bg-emerald-500",
        description: "Hacienda exige que cada producto tenga un código CAByS de 13 dígitos.",
        details: [
            "Al crear una nueva factura, use nuestro buscador inteligente de CAByS.",
            "Escriba una descripción simple (ej: 'Servicios de consultoría').",
            "Seleccione el código que mejor se adapte. El sistema recordará su elección.",
            "Defina el precio base. El sistema calculará el IVA automáticamente."
        ]
    },
    {
        id: "billing",
        title: "Paso 3: Emisión de Comprobantes",
        icon: <PlusCircle className="w-6 h-6" />,
        color: "bg-indigo-500",
        description: "El proceso de emisión es instantáneo y seguro.",
        details: [
            "Haga clic en 'Nueva Emisión' en el dashboard.",
            "Complete los datos del receptor (Cédula y Correo).",
            "Agregue las líneas de servicio o productos.",
            "Presione 'Emitir'. El Sentinel firmará y enviará el documento en milisegundos."
        ]
    },
    {
        id: "contingency",
        title: "Paso 4: Control de Contingencia",
        icon: <ShieldCheck className="w-6 h-6" />,
        color: "bg-amber-500",
        description: "Si Hacienda falla, Nova Billing lo protege automáticamente.",
        details: [
            "Si hay problemas de red, su factura se guardará en la 'Bóveda de Contingencia'.",
            "Usted puede entregar el PDF provisional al cliente de inmediato.",
            "El sistema reintentará el envío automáticamente cuando la red se estabilice.",
            "Usted siempre tendrá el control del estado en su historial."
        ]
    }
];

export default function GuidePage() {
    return (
        <div className="flex min-h-screen flex-col items-center p-8 sm:p-20 relative overflow-hidden bg-[#020617] selection:bg-primary/20">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -mr-96 -mt-96" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] -ml-64 -mb-64" />

            <main className="flex flex-col gap-12 w-full max-w-5xl z-10 text-white">
                <header className="flex flex-col md:flex-row justify-between items-end gap-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <BookOpen className="w-3 h-3" /> Manual del Usuario
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase">Guía de Entrenamiento Nova</h1>
                        <p className="text-slate-400 font-medium max-w-xl text-lg">
                            Domine el flujo de la red Sentinel. Aprenda a configurar, emitir y gestionar su facturación electrónica como un experto.
                        </p>
                    </div>
                </header>

                {/* Main Interactive Guide */}
                <div className="space-y-8">
                    {GUIDE_STEPS.map((step, i) => (
                        <motion.section
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="premium-card p-1 pr-1 !bg-white/[0.02] border-white/5 overflow-hidden group"
                        >
                            <div className="flex flex-col md:flex-row items-stretch">
                                <div className={`md:w-72 p-10 flex flex-col justify-center items-center text-center gap-4 ${step.color}/10 border-r border-white/5`}>
                                    <div className={`w-16 h-16 rounded-2xl ${step.color} shadow-lg shadow-${step.id}-500/20 flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform duration-500`}>
                                        {step.icon}
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">{step.title}</h3>
                                </div>
                                <div className="flex-1 p-10 space-y-6">
                                    <p className="text-lg font-bold text-white group-hover:text-primary transition-colors">{step.description}</p>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {step.details.map((detail, di) => (
                                            <li key={di} className="flex gap-3 text-xs text-slate-400 leading-relaxed font-medium">
                                                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-emerald-500 flex-shrink-0 mt-0.5">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                </div>
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </motion.section>
                    ))}
                </div>

                {/* Additional Resources */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-t border-white/5">
                    <div className="premium-card p-8 space-y-4 opacity-75 grayscale hover:grayscale-0 transition-all cursor-not-allowed group">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                            <Monitor className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-white uppercase tracking-tighter">Tutorial en Video</h4>
                        <p className="text-xs text-slate-500">Aprenda visualmente el flujo de emisión rápida.</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase mt-4">
                            PRÓXIMAMENTE <PlayCircle className="w-3" />
                        </div>
                    </div>

                    <Link href="/dashboard/docs" className="w-full">
                        <div className="premium-card p-10 space-y-4 hover:bg-white/[0.04] transition-all cursor-pointer group h-full border-white/5 hover:border-purple-500/30">
                            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-500">
                                <Zap className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-black text-white uppercase tracking-tighter">Ayuda Rápida</h4>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Resolución de errores de Hacienda y guías técnicas avanzadas.</p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase mt-4 tracking-widest group-hover:translate-x-1 transition-transform">
                                Explorar <ChevronRight className="w-3" />
                            </div>
                        </div>
                    </Link>

                    <a href="https://www.hacienda.go.cr/ATV/Login.aspx" target="_blank" rel="noopener noreferrer" className="w-full">
                        <div className="premium-card p-10 space-y-4 hover:bg-white/[0.04] transition-all cursor-pointer group h-full border-white/5 hover:border-emerald-500/30">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-500">
                                <Globe className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-black text-white uppercase tracking-tighter">Portal ATV</h4>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Gestione sus usuarios, llaves y declaraciones en el portal oficial.</p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase mt-4 tracking-widest group-hover:translate-x-1 transition-transform">
                                Ir a Hacienda <ChevronRight className="w-3" />
                            </div>
                        </div>
                    </a>
                </div>

                {/* Community & Support */}
                <footer className="p-16 rounded-[4rem] bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/5 border border-white/10 text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/5 border border-white/10 mb-2 relative z-10">
                        <HelpCircle className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-4 relative z-10">
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">¿Necesita asistencia especial?</h2>
                        <p className="text-slate-400 max-w-xl mx-auto font-medium text-lg leading-relaxed">
                            Configure sus credenciales Sentinel para habilitar la protección total o consulte a nuestra IA en los documentos.
                        </p>
                    </div>
                    <div className="flex gap-6 justify-center pt-6 relative z-10">
                        <Link href="/dashboard/docs">
                            <button className="px-10 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(59,130,246,0.4)]">
                                Centro de Ayuda
                            </button>
                        </Link>
                        <Link href="/dashboard/settings">
                            <button className="px-10 py-5 bg-white/5 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all border border-white/10 hover:text-white">
                                Configurar Ahora
                            </button>
                        </Link>
                    </div>
                </footer>
            </main>
        </div>
    );
}
