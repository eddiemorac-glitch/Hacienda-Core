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
    Monitor,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { TRAINING_MISSIONS, TrainingMission } from "@/lib/academy/scenarios";

/**
 * [NOVA ACADEMY - USER GUIDE v1.0]
 * Interactive and visual guide for non-technical users.
 */

const GUIDE_STEPS = [
    {
        id: "setup",
        title: "Paso 1: Su Identidad Digital",
        icon: <Key className="w-6 h-6" />,
        color: "bg-blue-500",
        description: "Para que sus facturas sean legales, el sistema debe saber quién es usted ante Hacienda.",
        details: [
            "Entre a 'Ajustes' en el menú de la izquierda.",
            "Suba su 'Llave Digital' (archivo .p12) que le dio Hacienda.",
            "Escriba su PIN de 4 números (el que creó en el portal ATV).",
            "Ingrese su Usuario y Contraseña que Hacienda le asignó.",
            "Presione 'Guardar'. Sentinel se encargará de validar todo por usted."
        ]
    },
    {
        id: "products",
        title: "Paso 2: Sus Productos y Servicios",
        icon: <Search className="w-6 h-6" />,
        color: "bg-emerald-500",
        description: "Hacienda pide un código especial (llamado CAByS) para cada cosa que venda.",
        details: [
            "No se complique: use nuestro buscador inteligente.",
            "Escriba lo que vende de forma sencilla (ej: 'Camisa' o 'Consulta').",
            "Elija la opción que más se parezca. El sistema la recordará siempre.",
            "El sistema pondrá el IVA correcto automáticamente por usted."
        ]
    },
    {
        id: "billing",
        title: "Paso 3: ¡Listo para Facturar!",
        icon: <PlusCircle className="w-6 h-6" />,
        color: "bg-indigo-500",
        description: "Hacer una factura ahora es tan fácil como enviar un mensaje.",
        details: [
            "Vaya a 'Nueva Emisión'.",
            "Ponga el nombre de su cliente y su correo.",
            "Agregue lo que vendió.",
            "Haga clic en 'Emitir'. El sistema firma, envía y le manda el correo al cliente."
        ]
    },
    {
        id: "contingency",
        title: "Paso 4: Tranquilidad Total",
        icon: <ShieldCheck className="w-6 h-6" />,
        color: "bg-amber-500",
        description: "Si el sistema de Hacienda falla, Nova Billing lo resuelve por usted.",
        details: [
            "Si no hay internet o Hacienda está caído, su factura se guarda segura.",
            "Usted puede darle un comprobante temporal a su cliente sin esperar.",
            "Apenas todo vuelva a la normalidad, el sistema envía la factura solo.",
            "Usted nunca dejará de vender por problemas técnicos."
        ]
    }
];

import { getDashboardStats } from "../actions/stats";
import { useEffect, useState } from "react";

export default function GuidePage() {
    const [readiness, setReadiness] = useState<{
        hasHaciendaConfig: boolean;
        org: any;
    } | null>(null);
    const [selectedMission, setSelectedMission] = useState<TrainingMission | null>(null);

    useEffect(() => {
        const fetchReadiness = async () => {
            const stats = await getDashboardStats();
            setReadiness(stats as any);
        };
        fetchReadiness();
    }, []);

    return (
        <div className="flex min-h-screen flex-col items-center p-8 sm:p-20 relative overflow-hidden bg-[#020617] selection:bg-primary/20">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -mr-96 -mt-96" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] -ml-64 -mb-64" />

            <main className="flex flex-col gap-12 w-full max-w-5xl z-10 text-white">
                <header className="flex flex-col md:flex-row justify-between items-start gap-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <BookOpen className="w-3 h-3" /> Entrenamiento Sentinel
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase italic">Aprende a Facturar</h1>
                        <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
                            No es solo software, es su socio digital. Aprenda a configurar la red Sentinel para una operación autónoma y legal.
                        </p>
                    </div>

                    {/* Readiness Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-6 rounded-3xl border ${readiness?.hasHaciendaConfig ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'} backdrop-blur-md flex flex-col gap-4 min-w-[300px]`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${readiness?.hasHaciendaConfig ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {readiness?.hasHaciendaConfig ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className="font-black text-xs uppercase tracking-widest">Estado de Listez</h4>
                                <p className={`text-[10px] font-bold ${readiness?.hasHaciendaConfig ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {readiness?.hasHaciendaConfig ? 'Sentinel Operacional' : 'Configuración Pendiente'}
                                </p>
                            </div>
                        </div>

                        {!readiness?.hasHaciendaConfig && (
                            <div className="space-y-3">
                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                    Sentinel detecta que aún no ha cargado sus llaves de Hacienda. No podrá emitir facturas legales hasta completar esto.
                                </p>
                                <Link href="/dashboard/settings">
                                    <button className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                        Resolver Ahora <ArrowRight className="w-3 h-3" />
                                    </button>
                                </Link>
                            </div>
                        )}
                        {readiness?.hasHaciendaConfig && (
                            <div className="space-y-3">
                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                    ¡Excelente! Su identidad digital está vinculada. Sentinel está protegiendo sus transacciones en tiempo real.
                                </p>
                                <Link href="/new">
                                    <button className="w-full py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                        Emitir Primera Factura <Zap className="w-3 h-3" />
                                    </button>
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </header>

                {/* Training Missions Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">M</div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Misiones de Entrenamiento</h2>
                        <div className="h-px bg-white/5 flex-1" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TRAINING_MISSIONS.map((mission) => (
                            <motion.div
                                key={mission.id}
                                whileHover={{ scale: 1.02, y: -5 }}
                                className={`p-6 rounded-3xl border transition-all cursor-pointer ${selectedMission?.id === mission.id ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                onClick={() => setSelectedMission(mission)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-black text-sm uppercase tracking-tight">{mission.title}</h3>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${mission.difficulty === 'Básico' ? 'bg-emerald-500/20 text-emerald-400' :
                                        mission.difficulty === 'Intermedio' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-rose-500/20 text-rose-400'
                                        }`}>
                                        {mission.difficulty}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium mb-4">{mission.description}</p>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                    {selectedMission?.id === mission.id ? 'Misión Seleccionada' : 'Seleccionar Misión'}
                                    <ArrowRight className="w-3" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {selectedMission && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] p-10 space-y-8"
                        >
                            <div className="flex flex-col md:flex-row gap-10">
                                <div className="flex-1 space-y-6">
                                    <h3 className="text-2xl font-black text-white uppercase italic">Objetivo de la Misión</h3>
                                    <p className="text-slate-400 text-lg font-medium leading-relaxed">{selectedMission.context}</p>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Lo que aprenderá:</h4>
                                        <ul className="space-y-3">
                                            {selectedMission.steps.map((step, idx) => (
                                                <li key={idx} className="flex gap-4 text-sm text-slate-300 font-medium">
                                                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-black flex-shrink-0">{idx + 1}</span>
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="md:w-72 flex flex-col justify-center gap-4">
                                    <Link href="/new" className="w-full">
                                        <button className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-lg shadow-primary/20">
                                            Empezar Misión <PlayCircle className="ml-2 w-4 h-4 inline" />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => setSelectedMission(null)}
                                        className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </section>

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
