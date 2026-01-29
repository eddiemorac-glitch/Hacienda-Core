"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldAlert, Cpu, Zap, RotateCcw, Play, CheckCircle2, AlertTriangle } from "lucide-react";
import { toggleSimulator, runGhostInvoices } from "./actions";

export default function QADashboard() {
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState<any[]>([]);
    const [simulatorStatus, setSimulatorStatus] = useState<'offline' | 'online'>('offline');

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
                    </div>

                    <div className="md:col-span-8">
                        <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden h-full">
                            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Execution Monitor</span>
                                <Activity className="w-4 h-4 text-primary animate-pulse" />
                            </div>

                            <div className="p-8 space-y-4">
                                {testResults.length === 0 ? (
                                    <div className="py-20 text-center text-slate-600 italic">
                                        Waiting for test execution...
                                    </div>
                                ) : (
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
