"use client";

import { useEffect, useState } from "react";
import { checkHaciendaHealth } from "@/app/dashboard/actions/stats";
import { Activity, Globe, Zap, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function SwarmHealthMonitor() {
    const [health, setHealth] = useState<{ status: string, latency: number, lastChecked: string } | null>(null);

    useEffect(() => {
        const updateHealth = async () => {
            const data = await checkHaciendaHealth();
            setHealth(data);
        };
        updateHealth();
        const interval = setInterval(updateHealth, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!health) return null;

    const isOnline = health.status === 'online';
    const isUnstable = health.status === 'unstable';

    return (
        <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
                <div className={`relative flex h-2 w-2`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-500' : isUnstable ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : isUnstable ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Hacienda {health.status}
                </span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2">
                <Zap className={`w-3 h-3 ${health.latency < 500 ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="text-[10px] font-mono text-slate-300">{health.latency}ms</span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold text-slate-300 uppercase">Staging</span>
            </div>
        </div>
    );
}
