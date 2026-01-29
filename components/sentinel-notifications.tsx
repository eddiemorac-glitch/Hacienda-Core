"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle, Info, X } from "lucide-react";

export function SentinelNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [lastId, setLastId] = useState<number>(0);

    useEffect(() => {
        const checkEvents = async () => {
            try {
                const res = await fetch(`/api/events?sinceId=${lastId}`);
                const newEvents = await res.json();

                if (newEvents.length > 0) {
                    const recoveries = newEvents.filter((e: any) => e.type === 'SENTINEL_RECOVERY');
                    if (recoveries.length > 0) {
                        setNotifications(prev => [...prev, ...recoveries].slice(-5));
                        setLastId(newEvents[newEvents.length - 1].id);
                    }
                }
            } catch (e) {
                // Silently fail if bus not initialized or network down
            }
        };

        const interval = setInterval(checkEvents, 10000); // Check every 10s
        checkEvents();
        return () => clearInterval(interval);
    }, [lastId]);

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
            <AnimatePresence>
                {notifications.map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        className="pointer-events-auto min-w-[300px] glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl flex items-start gap-4 shadow-2xl shadow-emerald-500/10"
                    >
                        <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Recuperación Exitosa</h4>
                            <p className="text-[10px] text-slate-300 mt-1">
                                El Sentinel ha rescatado la factura <span className="font-mono text-emerald-200">..{n.payload.clave.slice(-6)}</span> para <span className="font-bold">{n.payload.org}</span>.
                            </p>
                        </div>
                        <button onClick={() => removeNotification(n.id)} className="text-slate-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
