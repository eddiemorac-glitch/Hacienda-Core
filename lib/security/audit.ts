import { prisma } from "@/lib/db";

/**
 * [SENTINEL AUDITOR] - Action Tracking System
 * Logs critical operations for compliance and security forensics.
 */

export type AuditAction =
    | 'INVOICE_CREATE'
    | 'CONFIG_UPDATE'
    | 'AUTH_LOGIN'
    | 'AUTH_REGISTER'
    | 'API_KEY_CREATE'
    | 'STAGING_DOC_DELETE'
    | 'SUBSCRIPTION_CHANGE'
    | 'BRANDING_UPDATE';

export class AuditService {
    static async log(params: {
        orgId: string;
        userId?: string;
        action: AuditAction;
        details?: any;
        ip?: string;
    }) {
        try {
            // [ROBUSTNESS] Safe access to prisma model to avoid crashes if types aren't generated
            const audit = (prisma as any).auditLog;
            if (audit) {
                await audit.create({
                    data: {
                        orgId: params.orgId,
                        userId: params.userId,
                        action: params.action,
                        details: params.details || {},
                        ipAddress: params.ip
                    }
                });
            } else {
                console.warn("[AUDIT_WARN] auditLog model not found in Prisma Client. Skipping log.");
            }
        } catch (e) {
            console.error("[AUDIT_ERROR] Failed to save log:", e);
        }
    }
}
