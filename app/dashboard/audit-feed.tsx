"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Clock, Info, User, Activity, Lock, Key, FilePlus } from "lucide-react";
import { getAuditLogs } from "./actions/audit";

/**
 * [SENTINEL AUDIT FEED]
 * Real-time visualization of system actions.
 */
export function AuditLogFeed() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLogs() {
            const res = await getAuditLogs(1, 10);
            if (res.success) {
                setLogs(res.logs);
            }
            setLoading(false);
        }
        loadLogs();

        // Polling every 30 seconds for new events
        const interval = setInterval(loadLogs, 30000);
        return () => clearInterval(interval);
    }, []);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'INVOICE_CREATE': return <FilePlus className="w-4 h-4 text-emerald-400" />;
            case 'CONFIG_UPDATE': return <Key className="w-4 h-4 text-amber-400" />;
            case 'AUTH_REGISTER': return <User className="w-4 h-4 text-blue-400" />;
            default: return <Activity className="w-4 h-4 text-slate-400" />;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                    <Shield className="w-3 h-3" /> Sentinel Audit Trail
                </h3>
            </div>

            <div className="premium-card !p-0 overflow-hidden bg-white/[0.01]">
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs italic">
                        No se han registrado eventos recientemente.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {logs.map((log, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={log.id}
                                className="p-4 hover:bg-white/[0.02] transition-all flex items-start gap-4"
                            >
                                <div className="mt-1">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                                        {getActionIcon(log.action)}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black text-white tracking-widest uppercase">
                                            {log.action.replace('_', ' ')}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                                            <Clock className="w-3 h-3" />
                                            {new Date(log.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 line-clamp-1">
                                        {log.details?.clave || log.details?.email || 'Operación de sistema completada'}
                                    </p>
                                    {log.ipAddress && (
                                        <div className="mt-2 text-[8px] font-black text-slate-600 tracking-tighter uppercase px-2 py-0.5 bg-white/5 rounded w-fit">
                                            IP: {log.ipAddress}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
