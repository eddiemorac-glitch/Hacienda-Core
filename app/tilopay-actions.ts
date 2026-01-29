"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tilopay } from "@/lib/tilopay";

/**
 * [TILOPAY SERVER ACTIONS]
 * Handles payment flow for Costa Rica
 */

// Plan prices in CRC (Colones)
const TILOPAY_PLANS = {
    STARTER: {
        id: 'starter',
        name: 'Starter Node',
        priceCRC: 25000,
        intervalDays: 30
    },
    BUSINESS: {
        id: 'business',
        name: 'Business Swarm',
        priceCRC: 55000,
        intervalDays: 30
    },
    ENTERPRISE: {
        id: 'enterprise',
        name: 'Enterprise Ultra',
        priceCRC: 95000,
        intervalDays: 30
    }
};

export async function createTilopayCheckout(planId: string): Promise<{ url?: string; error?: string }> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { error: "No autorizado" };
        }

        const user = session.user as any;
        const orgId = user.orgId;

        if (!orgId) {
            return { error: "Organización no encontrada" };
        }

        // Get organization
        const org = await prisma.organization.findUnique({
            where: { id: orgId }
        });

        if (!org) {
            return { error: "Organización no encontrada" };
        }

        // Find plan
        const planKey = planId.toUpperCase() as keyof typeof TILOPAY_PLANS;
        const plan = TILOPAY_PLANS[planKey];

        if (!plan) {
            return { error: "Plan no válido" };
        }

        // Generate unique order ID
        const orderId = `ORD-${orgId.slice(0, 8)}-${Date.now()}`;

        // Get base URL
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        // Create checkout with Tilopay
        const result = await tilopay.createCheckout({
            amount: plan.priceCRC,
            currency: 'CRC',
            orderId,
            description: `Suscripción ${plan.name} - HaciendaCore`,
            customerEmail: user.email || '',
            customerName: org.name,
            redirectUrl: `${baseUrl}/dashboard/billing?payment=success&orderId=${orderId}`,
            callbackUrl: `${baseUrl}/api/webhooks/tilopay`,
            subscription: {
                planId: plan.id,
                intervalDays: plan.intervalDays
            }
        });

        if (!result.success) {
            return { error: result.error };
        }

        // Store pending transaction
        await prisma.organization.update({
            where: { id: orgId },
            data: {
                // Store pending order for verification
                tilopayOrderId: orderId,
                tilopayTransactionId: result.transactionId || null
            }
        });

        return { url: result.checkoutUrl };

    } catch (error: any) {
        console.error('[TILOPAY_ACTION]', error);
        return { error: error.message || 'Error al procesar pago' };
    }
}

export async function createTilopayPortal(): Promise<{ url?: string; error?: string }> {
    // Tilopay doesn't have a customer portal like Stripe
    // Instead, we redirect to our own billing management page
    return { url: '/dashboard/billing/manage' };
}

export async function verifyTilopayPayment(orderId: string): Promise<{
    success: boolean;
    plan?: string;
    error?: string
}> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "No autorizado" };
        }

        const user = session.user as any;

        // Find organization by order ID
        const org = await prisma.organization.findFirst({
            where: {
                id: user.orgId,
                tilopayOrderId: orderId
            }
        });

        if (!org || !org.tilopayTransactionId) {
            return { success: false, error: "Transacción no encontrada" };
        }

        // Verify with Tilopay
        const result = await tilopay.verifyTransaction(org.tilopayTransactionId);

        if (result.status === 'approved') {
            // Determine plan from order ID or stored data
            // For now, we'll need to parse it from the order context
            return { success: true, plan: org.plan || 'STARTER' };
        }

        return { success: false, error: `Estado: ${result.status}` };

    } catch (error: any) {
        console.error('[TILOPAY_VERIFY]', error);
        return { success: false, error: error.message };
    }
}
