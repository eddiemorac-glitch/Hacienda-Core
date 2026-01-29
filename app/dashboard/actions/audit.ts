"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth-options";

/**
 * [SENTINEL ANALYTICS] - Audit Retrieval
 * Fetches the trail of actions for the dashboard.
 */
export async function getAuditLogs(page: number = 1, limit: number = 10) {
    try {
        const session = await getServerSession(getAuthOptions());
        if (!session || !(session.user as any).orgId) {
            throw new Error("No autenticado");
        }

        const orgId = (session.user as any).orgId;
        const skip = (page - 1) * limit;

        // [ROBUSTNESS] Safe access
        const audit = (prisma as any).auditLog;
        if (!audit) {
            return {
                success: true,
                logs: [],
                pagination: { total: 0, pages: 0, currentPage: page }
            };
        }

        const [logs, total] = await Promise.all([
            audit.findMany({
                where: { orgId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            audit.count({ where: { orgId } })
        ]);

        return {
            success: true,
            logs,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        };
    } catch (error: any) {
        console.error("[AUDIT_FETCH_ERROR]", error);
        return { success: false, error: error.message };
    }
}
