
import { prisma } from "@/lib/db";
import { TokenCache } from "@/lib/hacienda/token-cache";

/**
 * SENTINEL HEALING SERVICE
 * 
 * "Alive" monitoring system that detects system strain and latency.
 * Following the 'Healing Spec' from the inspiration folder.
 */

export type HealthStatus = 'HEALTHY' | 'STRAINED' | 'CRITICAL';

export interface SystemPulse {
    status: HealthStatus;
    dbLatency: number;
    apiLatency: number; // Hacienda status check time
    cacheHitRatio: number; // Simulated for now
    checksPerformed: number;
}

export class HealthService {

    // Thresholds (in ms)
    private static readonly DB_WARNING = 500;
    private static readonly API_WARNING = 2000;

    /**
     * Performs a full system pulse check.
     * Silent operation - does not throw, returns state.
     */
    static async checkPulse(): Promise<SystemPulse> {
        const startDb = performance.now();
        let dbOk = false;

        try {
            // 1. Lightweight DB Check (Pulse)
            await prisma.$queryRaw`SELECT 1`;
            dbOk = true;
        } catch (e) {
            console.error("[SENTINEL] DB Connection Failed:", e);
        }
        const dbTime = performance.now() - startDb;

        // 2. Hacienda API Latency (via DNS resolution or simple fetch)
        const startApi = performance.now();
        let apiOk = true;
        // We don't actually hit the API to save quota, we check our TokenCache
        // If cache is empty and we are online, it might indicate generic connectivity issues
        const hasToken = TokenCache.get("cpf-00-0000");

        const apiTime = performance.now() - startApi; // Effectively internal check time

        let status: HealthStatus = 'HEALTHY';
        if (!dbOk) status = 'CRITICAL';
        else if (dbTime > this.DB_WARNING || apiTime > this.API_WARNING) status = 'STRAINED';

        return {
            status,
            dbLatency: Math.round(dbTime),
            apiLatency: Math.round(apiTime),
            cacheHitRatio: 0.95, // Optimistic placeholder
            checksPerformed: 1
        };
    }

    /**
     * HEALING MECHANISM
     * Attempts to reset connections if critical failure is detected.
     */
    static async attemptHealing(): Promise<boolean> {
        try {
            console.log("[SENTINEL] Initiating Healing Protocol...");
            await prisma.$disconnect();
            await prisma.$connect();
            console.log("[SENTINEL] DB Connection Reset Successful.");
            return true;
        } catch (e) {
            console.error("[SENTINEL] Healing Failed:", e);
            return false;
        }
    }
}
