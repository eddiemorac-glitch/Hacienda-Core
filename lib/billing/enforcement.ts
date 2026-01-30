
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/stripe-config";

/**
 * [SENTINEL BILLING ENFORCEMENT]
 * Strict logic to protect revenue and enforce quotas.
 */
export class BillingEnforcement {

    /**
     * Verifies if an organization is allowed to emit a new document.
     * Throws an error with human-centric messages if quota is exceeded or subscription expired.
     */
    static async verifyAccess(orgId: string, type: 'FE' | 'REP' | 'FEC') {
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                plan: true,
                subscriptionStatus: true,
                subscriptionEndsAt: true
            }
        });

        if (!org) throw new Error("Organización no encontrada en la red Sentinel.");

        // 1. EXPIRATION CHECK
        // If the date is passed and status is not 'active' (or trialing/approved)
        const now = new Date();
        if (org.subscriptionEndsAt && now > org.subscriptionEndsAt) {
            // Allow a 1-day grace period for approval latency
            const gracePeriod = new Date(org.subscriptionEndsAt.getTime() + 24 * 60 * 60 * 1000);
            if (now > gracePeriod && org.subscriptionStatus !== 'active') {
                throw new Error("Acceso Restringido: Su período de suscripción ha terminado. Por favor, realice su pago por SINPE para reactivar su nodo.");
            }
        }

        // 2. QUOTA CHECK
        const rawPlan = (org.plan || 'STARTER').toUpperCase();
        const planConfig = Object.values(PLANS).find((p) => p.id.toUpperCase() === rawPlan);

        if (!planConfig) throw new Error("Plan de suscripción no reconocido.");

        // If the plan has a finite quota (like STARTER)
        if (planConfig.quota !== Infinity) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const count = await prisma.invoice.count({
                where: {
                    orgId,
                    createdAt: { gte: startOfMonth }
                }
            });

            if (count >= planConfig.quota) {
                throw new Error(`Potencia Agotada: Ha alcanzado el límite de ${planConfig.quota} facturas de su plan ${org.plan}. Actualice su plan a Business para facturación ilimitada.`);
            }
        }

        // 3. FEATURE CHECK
        if (!planConfig.allowedTypes.includes(type as any)) {
            throw new Error(`Característica Bloqueada: Su plan actual no admite la emisión de comprobantes tipo ${type}.`);
        }

        return true;
    }
}
