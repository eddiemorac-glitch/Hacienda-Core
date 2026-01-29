"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Loader2, Building2, User, Mail, Lock, CreditCard } from "lucide-react";
import Link from "next/link";
import { register } from "../actions";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
    const router = useRouter();
    const { status } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, router]);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        orgName: "",
        cedula: ""
    });

    const searchParams = useSearchParams();
    const planParam = searchParams.get("plan")?.toUpperCase();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const res = await register({ ...formData, plan: planParam });

        if (res.success) {
            // Auto login after registration
            const loginRes = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false
            });

            if (loginRes?.ok) {
                // If a paid plan was selected, go to manual SINPE checkout
                if (planParam && planParam !== 'STARTER') {
                    router.push(`/dashboard/billing/checkout?plan=${planParam}`);
                    return;
                }
                router.push("/dashboard");
            } else {
                router.push("/login");
            }
        } else {
            setError(res.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] -ml-64 -mb-64" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl glass-card rounded-[2.5rem] p-8 md:p-12 relative z-10 border border-white/5 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center mb-10">
                    <Link href="/" className="mb-6">
                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Únete a HaciendaCore</h1>
                    <p className="text-slate-400 text-sm">Comienza a facturar con la tecnología más avanzada de CR.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Org Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Información de la Empresa</h3>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    required
                                    placeholder="Nombre de la Empresa"
                                    value={formData.orgName}
                                    onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                                    className="modern-input pl-12"
                                />
                            </div>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    required
                                    placeholder="Cédula Jurídica / Física"
                                    value={formData.cedula}
                                    onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                                    className="modern-input pl-12"
                                />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Cuenta de Administrador</h3>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    required
                                    placeholder="Nombre Completo"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="modern-input pl-12"
                                />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    required
                                    type="email"
                                    placeholder="correo@ejemplo.com"
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
                                    placeholder="Contraseña Segura"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="modern-input pl-12"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={isLoading}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creando cuenta...
                                </>
                            ) : (
                                <>
                                    Crear Mi Cuenta
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-center text-slate-500 text-sm">
                        ¿Ya tienes una cuenta? <Link href="/login" className="text-primary font-bold hover:underline">Inicia Sesión</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
