"use client";

import { motion } from "framer-motion";
import { BookOpen, Lightbulb, Zap, ArrowRight, Info } from "lucide-react";
import Link from "next/link";

const KNOWLEDGE_BITS = [
    {
        title: "Diferimiento del IVA",
        text: "Las ventas a crédito le permiten pagar el IVA a Hacienda hasta 90 días después. Ideal para servicios al Estado.",
        category: "Tip Fiscal",
        icon: <Lightbulb className="w-4 h-4 text-amber-400" />
    },
    {
        title: "Recibo de Pago (REP)",
        text: "Recuerde: si vendió a crédito, Hacienda le exige emitir el REP apenas reciba el dinero del cliente.",
        category: "Obligatorio v4.4",
        icon: <Info className="w-4 h-4 text-primary" />
    },
    {
        title: "Buscador CABYS",
        text: "Evite errores de validación usando nuestro buscador inteligente con más de 20,000 registros legales.",
        category: "Optimización",
        icon: <Zap className="w-4 h-4 text-purple-400" />
    }
];

export function SentinelCoach() {
    return (
        <section className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <BookOpen className="w-3 h-3" /> Sentinel Coach & Inteligencia
            </h3>

            <div className="grid gap-4">
                {KNOWLEDGE_BITS.map((bit, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="premium-card p-5 border-white/5 hover:border-white/10 transition-all group"
                    >
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                {bit.icon}
                            </div>
                            <div className="space-y-1 flex-1">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-xs text-white">{bit.title}</h4>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{bit.category}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                    {bit.text}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <Link href="/dashboard/guide" className="block text-center p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <span className="text-[10px] font-black text-slate-500 group-hover:text-primary transition-colors flex items-center justify-center gap-2">
                    IR AL PORTAL DE APRENDIZAJE <ArrowRight className="w-3 h-3" />
                </span>
            </Link>
        </section>
    );
}
