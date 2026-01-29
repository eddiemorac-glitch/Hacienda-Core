"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Key,
    Plus,
    Trash2,
    Copy,
    Check,
    Activity,
    ShieldAlert,
    BarChart3,
    Terminal,
    Book
} from "lucide-react";
import Link from "next/link";
import { getApiKeys, createNewApiKey, deleteApiKey, getApiUsage } from "../../api-key-actions";

export default function ApiSettingsPage() {
    const [keys, setKeys] = useState<any[]>([]);
    const [usage, setUsage] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKeyName, setNewKeyName] = useState("");
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [keysData, usageData] = await Promise.all([
                getApiKeys(),
                getApiUsage()
            ]);
            setKeys(keysData);
            setUsage(usageData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName) return;
        try {
            const res = await createNewApiKey(newKeyName);
            if (res.success) {
                setGeneratedKey(res.key as string);
                setNewKeyName("");
                loadData();
            }
        } catch (e) {
            alert("Error al crear la llave");
        }
    };

    const handleDeleteKey = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar esta llave? Las integraciones que la usan dejarán de funcionar.")) return;
        try {
            await deleteApiKey(id);
            loadData();
        } catch (e) {
            alert("Error al eliminar");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex min-h-screen flex-col items-center p-8 sm:p-20 relative overflow-hidden bg-[#020617]">
            <main className="flex flex-col gap-8 w-full max-w-5xl z-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                <Terminal className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">API Monetization</h1>
                        </div>
                        <p className="text-slate-400">Administre sus llaves de acceso y monitoree el consumo de su infraestructura.</p>
                    </div>
                    <Link href="/dashboard/docs">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all text-white">
                            <Book className="w-4 h-4 text-primary" />
                            VER DOCUMENTACIÓN
                        </button>
                    </Link>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Key Management */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="glass-card p-6 rounded-[2rem] border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Key className="w-5 h-5 text-amber-400" />
                                Mis API Keys
                            </h3>

                            <form onSubmit={handleCreateKey} className="flex gap-4 mb-8">
                                <input
                                    value={newKeyName}
                                    onChange={e => setNewKeyName(e.target.value)}
                                    placeholder="Nombre de la llave (Ej: E-Commerce Main)"
                                    className="modern-input flex-1"
                                />
                                <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                                    <Plus className="w-4 h-4" />
                                    GENERAR
                                </button>
                            </form>

                            <AnimatePresence>
                                {generatedKey && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl relative"
                                    >
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                                            <ShieldAlert className="w-4 h-4" />
                                            ¡LLAVE GENERADA! Cópiela ahora, no se volverá a mostrar.
                                        </div>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-black/40 p-3 rounded-lg text-emerald-300 font-mono text-sm break-all">
                                                {generatedKey}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(generatedKey)}
                                                className="p-3 bg-emerald-500 text-white rounded-lg"
                                            >
                                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setGeneratedKey(null)}
                                            className="mt-4 text-xs text-slate-500 underline"
                                        >
                                            Entendido, ya la guardé
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4">
                                {keys.map(key => (
                                    <div key={key.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                                        <div>
                                            <div className="font-bold text-white">{key.name}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-1">
                                                Prefix: {key.prefix}... • Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteKey(key.id)}
                                            className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {keys.length === 0 && !loading && (
                                    <div className="text-center py-10 text-slate-500 text-sm">
                                        No tiene llaves API activas.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Usage Stats */}
                    <div className="space-y-6">
                        <section className="glass-card p-6 rounded-[2rem] border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary" />
                                Consumo Diario
                            </h3>

                            <div className="space-y-4">
                                {usage.map(u => (
                                    <div key={u.id} className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-slate-400">{new Date(u.date).toLocaleDateString()}</span>
                                            <span className="text-white">{u.calls} llamadas</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((u.calls / 100) * 100, 100)}%` }} // Assuming 100 as baseline for trial
                                                className="bg-primary h-full rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {usage.length === 0 && !loading && (
                                    <div className="text-center py-10 text-slate-500 text-sm italic">
                                        No hay datos de consumo registrados.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="p-6 rounded-[2rem] bg-indigo-600/10 border border-indigo-600/20">
                            <div className="flex items-center gap-3 mb-3">
                                <Activity className="w-5 h-5 text-indigo-400" />
                                <h4 className="text-sm font-bold text-indigo-300">Sandbox Mode</h4>
                            </div>
                            <p className="text-xs text-indigo-400/80 leading-relaxed">
                                Todas las peticiones API en modo pruebas no tienen costo y se envían al ambiente de Staging de Hacienda.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
