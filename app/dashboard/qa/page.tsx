"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldAlert, Cpu, Zap, RotateCcw, Play, CheckCircle2, AlertTriangle, Search, History, Terminal } from "lucide-react";
import { toggleSimulator, runGhostInvoices, getLastInvoiceClave, queryHaciendaStatus } from "./actions";

export default function QADashboard() {
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState<any[]>([]);
    const [simulatorStatus, setSimulatorStatus] = useState<'offline' | 'online'>('offline');
    const [queryClave, setQueryClave] = useState("");
    const [isQuerying, setIsQuerying] = useState(false);
    const [queryResult, setQueryResult] = useState<any>(null);

    const handleToggleSimulator = async () => {
        const newStatus = simulatorStatus === 'online' ? 'offline' : 'online';
        await toggleSimulator(newStatus === 'online');
        setSimulatorStatus(newStatus);
    };

    const runStressTest = async () => {
        setIsRunning(true);
        setTestResults([{ name: "Iniciando ráfaga Gamma (3 docs)...", status: "pending" }]);

        try {
            const results = await runGhostInvoices();
            setTestResults(results.map((r, i) => ({
                name: `Ghost Invoice #${i + 1} - ${r.clave?.slice(-8) || 'N/A'}`,
                status: r.status === 'success' ? 'success' : 'error'
            })));
        } catch (e: any) {
            setTestResults([{ name: "Error de ejecución", status: "error" }]);
        } finally {
            setIsRunning(false);
        }
    };

    const handleGetLastClave = async () => {
        const lastClave = await getLastInvoiceClave();
        if (lastClave) setQueryClave(lastClave);
        else alert("No se encontraron facturas en esta organización.");
    };

    const handleQueryStatus = async () => {
        if (queryClave.length !== 50) {
            alert("La clave debe tener exactamente 50 dígitos.");
            return;
        }
        setIsQuerying(true);
        setQueryResult(null);
        try {
            const res = await queryHaciendaStatus(queryClave);
            setQueryResult(res);
        } catch (e: any) {
            setQueryResult({ success: false, error: e.message });
        } finally {
            setIsQuerying(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center p-8 sm:p-20 relative overflow-hidden bg-[#020617]">
            <main className="flex flex-col gap-8 w-full max-w-5xl z-10 text-white">
                <header className="flex justify-between items-center w-full py-6 mb-8 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/50">
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight uppercase">Sentinel QA Bench</h1>
                            <p className="text-xs text-muted-foreground">Rigorous Testing & Simulation Environment</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all ${simulatorStatus === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-white/10'
                            }`}>
                            SIMULATOR: {simulatorStatus.toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-4 space-y-6">
                        <section className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-6">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> System Control
                            </h3>

                            <div className="space-y-4">
                                <button
                                    onClick={handleToggleSimulator}
                                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between px-6 group"
                                >
                                    <span className="font-bold">Hacienda Simulator</span>
                                    <div className={`w-3 h-3 rounded-full ${simulatorStatus === 'online' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-slate-600'}`} />
                                </button>

                                <button
                                    disabled={isRunning}
                                    onClick={runStressTest}
                                    className="w-full py-4 rounded-2xl bg-primary text-white font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                                >
                                    {isRunning ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                    RUN FULL STRESS TEST
                                </button>
                            </div>
                        </section>

                        <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10">
                            <div className="flex items-center gap-3 mb-3 text-indigo-400">
                                <Zap className="w-5 h-5" />
                                <h4 className="text-sm font-bold">Neural Oversight</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Sentinel is monitoring the event bus for semantic drift. Any deviation from the XAdES-EPES v4.4 spec will trigger an auto-rollback.
                            </p>
                        </div>

                        {/* [NEW] Verification Tool Section */}
                        <section className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Search className="w-4 h-4" /> Hacienda Verification
                                </h3>
                                <button
                                    onClick={handleGetLastClave}
                                    title="Traer última clave"
                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-primary transition-all"
                                >
                                    <History className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Clave de 50 dígitos..."
                                        value={queryClave}
                                        onChange={(e) => setQueryClave(e.target.value.replace(/\D/g, '').slice(0, 50))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                    <span className="absolute right-3 top-3.5 text-[10px] text-slate-600">
                                        {queryClave.length}/50
                                    </span>
                                </div>

                                <button
                                    disabled={isQuerying || queryClave.length !== 50}
                                    onClick={handleQueryStatus}
                                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase hover:bg-white/10 hover:border-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                                >
                                    {isQuerying ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                                    Consultar en Hacienda
                                </button>
                            </div>
                        </section>
                    </div>

                    <div className="md:col-span-8">
                        <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden h-full">
                            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Execution Monitor</span>
                                <Activity className="w-4 h-4 text-primary animate-pulse" />
                            </div>

                            <div className="p-8 space-y-4">
                                {testResults.length === 0 && !queryResult ? (
                                    <div className="py-20 text-center text-slate-600 italic">
                                        Waiting for execution or status query...
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Status Query Result Display */}
                                        <AnimatePresence>
                                            {queryResult && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest border-b border-emerald-500/20 pb-2">
                                                        <Terminal className="w-3.5 h-3.5" /> Hacienda Raw Response
                                                    </div>
                                                    <div className="bg-black/50 rounded-2xl p-6 border border-emerald-500/10 font-mono text-[10px] overflow-x-auto max-h-[400px]">
                                                        <pre className="text-emerald-500/80 leading-relaxed">
                                                            {JSON.stringify(queryResult, null, 2)}
                                                        </pre>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Stress Test Results Display */}
                                        <AnimatePresence>
                                            {testResults.map((test, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${test.status === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                                                            test.status === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-slate-500/20 text-slate-400'
                                                            }`}>
                                                            {test.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                                                                test.status === 'error' ? <ShieldAlert className="w-5 h-5" /> :
                                                                    <Activity className="w-5 h-5 animate-pulse" />}
                                                        </div>
                                                        <span className="font-bold text-sm tracking-tight">{test.name}</span>
                                                    </div>
                                                    <div className="text-[10px] font-mono text-slate-500">
                                                        {test.status.toUpperCase()}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
