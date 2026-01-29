"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    Lock,
    User,
    Key,
    Upload,
    Save,
    Loader2,
    CheckCircle2,
    Building2,
    ChevronLeft,
    AlertTriangle,
    Zap,
    Fingerprint
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "../actions/stats";
import { updateHaciendaConfig } from "@/app/settings-actions";

/**
 * [SENTINEL SETTINGS - VAULT SECURITY]
 * High-security interface for cryptographic keys and API identity.
 */

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        haciendaUser: "",
        haciendaPass: "",
        haciendaPin: "",
        haciendaP12: ""
    });
    // Indicadores de configuración existente (no valores reales)
    const [existingConfig, setExistingConfig] = useState({
        hasPass: false,
        hasPin: false,
        hasP12: false
    });
    const [p12FileName, setP12FileName] = useState("");
    const [showSavedToast, setShowSavedToast] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const stats = await getDashboardStats();
                if (stats.org) {
                    const org = stats.org as any;
                    setConfig({
                        haciendaUser: org.haciendaUser || "",
                        haciendaPass: "", // Nunca mostramos contraseñas encriptadas
                        haciendaPin: "",   // Nunca mostramos PINs encriptados
                        haciendaP12: ""    // Solo se carga cuando se sube un nuevo archivo
                    });
                    setExistingConfig({
                        hasPass: !!org.hasHaciendaPass,
                        hasPin: !!org.hasHaciendaPin,
                        hasP12: !!org.hasHaciendaP12
                    });
                }
            } catch (e) {
                console.error("Load settings failed", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setP12FileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = (event.target?.result as string).split(",")[1];
                setConfig(prev => ({ ...prev, haciendaP12: base64 }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateHaciendaConfig(config);
            setShowSavedToast(true);
            setTimeout(() => setShowSavedToast(false), 3000);
        } catch (e) {
            alert("Error al sincronizar con la bóveda");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    return (
        <div className="flex min-h-screen flex-col items-center p-8 sm:p-20 relative overflow-hidden bg-[#020617] selection:bg-primary/20">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -ml-64 -mb-64" />

            <main className="flex flex-col gap-10 w-full max-w-5xl z-10 text-white">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-10">
                    <div className="space-y-2">
                        <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-primary transition-colors mb-4">
                            <ChevronLeft className="w-3 h-3" /> Dashboard
                        </Link>
                        <h1 className="text-4xl font-black italic tracking-tighter text-white flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                <Shield className="w-7 h-7 text-primary" />
                            </div>
                            ESTACIÓN DE IDENTIDAD
                        </h1>
                        <p className="text-sm text-slate-400 font-medium">Arquitectura de Bóveda Zero-Knowledge v4.4</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">Encryption: AES-256</span>
                            <span className="text-[10px] font-black text-slate-600 mt-2 uppercase tracking-widest">Memoria Segmentada</span>
                        </div>
                    </div>
                </header>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Security Info Card */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="premium-card p-8 bg-white/[0.01]">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <Fingerprint className="w-4 h-4 text-primary" /> Infraestructura
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
                                Los datos aquí guardados se utilizan exclusivamente para firmar y transmitir comprobantes a Hacienda. <span className="text-white">Sentinel no almacena estas llaves en texto plano.</span>
                            </p>
                            <div className="space-y-3">
                                {[
                                    { label: 'Firmado XAdES-EPES', ok: true },
                                    { label: 'Token de Hacienda v4.4', ok: true },
                                    { label: 'Vínculo de Bóveda', ok: config.haciendaUser ? true : false }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                                        {item.ok ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-amber-500/[0.02] border border-amber-500/10">
                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4" /> Importante
                            </h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                Asegúrese de que sus credenciales correspondan al ambiente de PRODUCCIÓN o PRUEBAS según su configuración general.
                            </p>
                        </div>
                    </div>

                    {/* Inputs Area */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="premium-card p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="col-span-2">
                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="w-6 h-0.5 bg-primary rounded-full" /> Credenciales API
                                </h3>
                            </div>

                            <div className="group/input space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block group-focus-within/input:text-primary transition-colors">Usuario de Sistema (Físico/Jurídico)</label>
                                <input
                                    required
                                    value={config.haciendaUser}
                                    onChange={e => setConfig({ ...config, haciendaUser: e.target.value })}
                                    placeholder="cpf-01-xxxx-xxxxxx ó cpf-02-xxxx-xxxxxxxx"
                                    className="modern-input font-mono"
                                />
                                <p className="text-[9px] text-slate-600 ml-1">Físico: cpf-01-xxxx-xxxxxx | Jurídico: cpf-02-xxxx-xxxxxxxx</p>
                            </div>

                            <div className="group/input space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block group-focus-within/input:text-primary transition-colors">
                                    Password API {existingConfig.hasPass && <span className="text-emerald-500 ml-2">✓ Configurado</span>}
                                </label>
                                <input
                                    required={!existingConfig.hasPass}
                                    type="password"
                                    value={config.haciendaPass}
                                    onChange={e => setConfig({ ...config, haciendaPass: e.target.value })}
                                    placeholder={existingConfig.hasPass ? "Dejar vacío para mantener actual" : "Ingrese la contraseña del API"}
                                    className={`modern-input ${existingConfig.hasPass && !config.haciendaPass ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}
                                />
                                {existingConfig.hasPass && <p className="text-[9px] text-emerald-600 ml-1">Deje en blanco para mantener la contraseña actual</p>}
                            </div>

                            <div className="col-span-2 pt-10 border-t border-white/5">
                                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="w-6 h-0.5 bg-emerald-400 rounded-full" /> Firma Criptográfica
                                </h3>
                            </div>

                            <div className="group/input space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">
                                    PIN de Llave {existingConfig.hasPin && <span className="text-emerald-500 ml-2">✓ Configurado</span>}
                                </label>
                                <input
                                    required={!existingConfig.hasPin}
                                    minLength={4}
                                    maxLength={20}
                                    type="password"
                                    value={config.haciendaPin}
                                    onChange={e => setConfig({ ...config, haciendaPin: e.target.value })}
                                    placeholder={existingConfig.hasPin ? "Dejar vacío para mantener PIN actual" : "Ingrese el PIN del certificado"}
                                    className={`modern-input text-xl tracking-[0.3em] text-center ${existingConfig.hasPin && !config.haciendaPin ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}
                                />
                                {existingConfig.hasPin && <p className="text-[9px] text-emerald-600 ml-1">Deje en blanco para mantener el PIN actual</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">
                                    Certificado .p12 {existingConfig.hasP12 && <span className="text-emerald-500 ml-2">✓ Configurado</span>}
                                </label>
                                <div className="relative group/file h-[3.25rem]">
                                    <input
                                        type="file"
                                        accept=".p12"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`absolute inset-0 modern-input flex items-center justify-between px-6 group-hover/file:border-emerald-500/30 group-hover/file:bg-emerald-500/5 transition-all ${existingConfig.hasP12 && !p12FileName ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
                                        <span className="text-[11px] text-slate-400 font-bold tracking-tight">
                                            {p12FileName || (existingConfig.hasP12 ? "✓ CERTIFICADO ACTIVO - Click para reemplazar" : "SUBIR LLAVE .P12")}
                                        </span>
                                        <Upload className={`w-4 h-4 ${existingConfig.hasP12 || p12FileName ? 'text-emerald-500' : 'text-slate-500'}`} />
                                    </div>
                                </div>
                                {existingConfig.hasP12 && <p className="text-[9px] text-emerald-600 ml-1">Certificado guardado de forma segura. Solo suba uno nuevo si desea reemplazarlo.</p>}
                            </div>

                            <div className="col-span-2 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                <p className="text-[10px] text-slate-500 max-w-sm italic font-medium leading-relaxed">
                                    Al hacer click en guardar, Sentinel sincronizará su identidad con el enjambre de transmisión segura.
                                </p>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:scale-[1.03] active:scale-95 transition-all shadow-[0_25px_50px_-15px_rgba(59,130,246,0.5)] flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {saving ? 'SINCRONIZANDO...' : 'Sincronizar Bóveda'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            {/* Notification Toast */}
            <AnimatePresence>
                {showSavedToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-10 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 z-50"
                    >
                        <Zap className="w-4 h-4 fill-current" /> Sincronización Exitosa
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
