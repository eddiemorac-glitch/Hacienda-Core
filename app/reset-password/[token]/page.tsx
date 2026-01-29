"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Key, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { resetPassword } from "../../actions/auth";

export default function ResetPasswordPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirm) {
            setResult({ success: false, message: "Las contraseñas no coinciden." });
            return;
        }

        if (password.length < 8) {
            setResult({ success: false, message: "La contraseña debe tener al menos 8 caracteres." });
            return;
        }

        setIsLoading(true);
        try {
            const res = await resetPassword(token, password);
            setResult(res);
            if (res.success) {
                setTimeout(() => router.push("/login"), 3000);
            }
        } catch (error) {
            setResult({ success: false, message: "Error crítico al actualizar la contraseña." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] -mr-64 -mt-64" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-card rounded-[2.5rem] p-10 relative z-10 border border-white/5 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 mb-6">
                        <Key className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Nueva Contraseña</h1>
                    <p className="text-slate-400 text-sm italic">Establezca sus nuevas credenciales de acceso.</p>
                </div>

                {!result?.success ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {result && !result.success && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {result.message}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    required
                                    type="password"
                                    placeholder="Nueva Contraseña (min 8)"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="modern-input pl-12"
                                />
                            </div>
                            <div className="relative">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    required
                                    type="password"
                                    placeholder="Confirmar Contraseña"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    className="modern-input pl-12"
                                />
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg hover:bg-blue-500 transition-all shadow-[0_0_40px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Actualizar Credenciales'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center p-6 space-y-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h4 className="text-white font-bold">¡Todo listo!</h4>
                        <p className="text-slate-400 text-xs">{result.message}</p>
                        <p className="text-[10px] text-slate-500 italic pt-2">Redirigiendo al login...</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
