"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, router]);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const res = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false
        });

        if (res?.ok) {
            router.push("/dashboard");
        } else {
            setError("Credenciales incorrectas o cuenta inexistente.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] -mr-64 -mt-64" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-card rounded-[2.5rem] p-10 relative z-10 border border-white/5 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center mb-10">
                    <Link href="/" className="mb-6">
                        <div className="w-16 h-16 flex items-center justify-center p-2">
                            <img src="/logo-hacienda-core.svg" alt="HaciendaCore Logo" className="w-full h-full" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Bienvenido</h1>
                    <p className="text-slate-400 text-sm">Gestiona tu facturación v4.4 con seguridad.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                required
                                type="email"
                                placeholder="Correo Electrónico"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="modern-input pl-12"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                required
                                type="password"
                                placeholder="Contraseña"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="modern-input pl-12"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-primary accent-primary transition-all" defaultChecked />
                            <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">Mantener sesión iniciada</span>
                        </label>
                        <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-primary transition-colors">¿Olvidaste tu contraseña?</Link>
                    </div>

                    <div className="pt-2">
                        <button
                            disabled={isLoading}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Entrar al Sistema
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-center text-slate-500 text-sm">
                        ¿No tienes cuenta? <Link href="/register" className="text-primary font-bold hover:underline">Regístrate gratis</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
