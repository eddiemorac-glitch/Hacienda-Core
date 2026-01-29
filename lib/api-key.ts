import { prisma } from "./db";
import crypto from "node:crypto";
import { PLANS } from "./stripe";

/**
 * [MONETIZATION ENGINE] - API Key & Usage Service
 * Handles secure key generation, validation, and rate limiting.
 */

export class ApiKeyService {

    /**
     * Generates a new API Key for an organization.
     * Returns the raw key (only shown once).
     */
    static async generate(orgId: string, name: string) {
        const rawKey = `hc_${orgId.slice(0, 4)}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        const prefix = rawKey.slice(0, 8);

        // Hash the key for storage
        const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

        await prisma.apiKey.create({
            data: {
                key: hashedKey,
                prefix: prefix,
                name: name,
                orgId: orgId
            }
        });

        return rawKey;
    }

    /**
     * Validates an API Key and checks for usage limits.
     */
    static async validateAndTrack(rawKey: string) {
        const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

        const apiKey = await prisma.apiKey.findUnique({
            where: { key: hashedKey },
            include: { organization: true }
        });

        if (!apiKey || !apiKey.isActive) {
            throw new Error("API Key inválida o inactiva.");
        }

        // Check Rate Limits based on plan
        const plan = apiKey.organization.plan;
        const limits = {
            'STARTER': 100, // 100 calls/day
            'BUSINESS': 5000,
            'ENTERPRISE': 100000
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const usage = await prisma.apiUsage.upsert({
            where: {
                orgId_date: {
                    orgId: apiKey.orgId,
                    date: today
                }
            },
            update: {},
            create: {
                orgId: apiKey.orgId,
                date: today,
                calls: 0
            }
        });

        const maxCalls = (limits as any)[plan] || 0;
        if (usage.calls >= maxCalls) {
            throw new Error(`Límite de API excedido para el plan ${plan}. Por favor, actualice su plan.`);
        }

        // Increment usage
        await prisma.apiUsage.update({
            where: { id: usage.id },
            data: { calls: { increment: 1 } }
        });

        // Update last used
        await prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { lastUsed: new Date() }
        });

        return apiKey.organization;
    }
}
