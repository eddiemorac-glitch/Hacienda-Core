"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

/**
 * [SWARM ORCHESTRATOR - FRONTEND]
 * Manages global application state, session synchronization, 
 * and predictive intelligence coordination.
 */

export function useFrontendSwarm() {
    const { data: session, status } = useSession();
    const [isHydrated, setIsHydrated] = useState(false);
    const [predictiveCache, setPredictiveCache] = useState<Record<string, any>>({});

    // Ensure hydration safety
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const updateCache = useCallback((key: string, value: any) => {
        setPredictiveCache(prev => ({ ...prev, [key]: value }));
        // Also sync with global window for legacy/external component access
        if (typeof window !== 'undefined') {
            (window as any)._prefetch_cache = { ...(window as any)._prefetch_cache, [key]: value };
        }
    }, []);

    return {
        session,
        status,
        updateSession: useSession().update, // [SYNC] Expose session refresher
        isLoading: status === "loading" || !isHydrated,
        isHydrated,
        predictiveCache,
        updateCache
    };
}
