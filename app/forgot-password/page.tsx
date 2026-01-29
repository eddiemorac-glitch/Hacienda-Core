"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { requestPasswordReset } from "../actions/auth";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await requestPasswordReset(email);
            setResult(res);
        } catch (error) {
            setResult({ success: false, message: "Ocurrió un error al procesar su solicitud." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600 rounded-full blur-[120px] -mr-64 -mt-64" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-card rounded-[2.5rem] p-10 relative z-10 border border-white/5 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center mb-8">
                    <Link href="/login" className="mb-6 self-start group">
                        <div className="flex items-center gap-2 text-slate-500 group-hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
                        </div>
                    </Link>
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 mb-6 font-bold">
                        <Shield className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Recuperar Acceso</h1>
                    <p className="text-slate-400 text-sm italic">Le enviaremos un código de seguridad para restablecer su clave.</p>
                </div>

                {!result ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                required
                                type="email"
                                placeholder="Correo Institucional / Profesional"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="modern-input pl-12"
                            />
                        </div>

                        <button
                            disabled={isLoading}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-500 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Solicitar Código
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-4"
                    >
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <p className="text-white font-bold">{result.message}</p>
                        <div className="text-xs text-slate-500 pt-2 border-t border-white/5 italic">
                            Revise su bandeja de entrada (y la carpeta de SPAM).
                        </div>
                        <Link href="/login">
                            <button className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all">
                                VOLVER AL INICIO
                            </button>
                        </Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
