"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PLAN_PRICES, SINPE_INFO, PLAN_HIERARCHY } from "@/lib/payment-config";

/**
 * [HYBRID PAYMENT SYSTEM]
 * Server actions for manual payment verification and plan activation
 */



/**
 * Creates a new upgrade request
 */
export async function createUpgradeRequest(requestedPlan: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: "No autorizado" };
    }

    const user = session.user as any;
    const orgId = user.orgId;

    if (!orgId) {
        return { error: "Organización no encontrada" };
    }

    try {
        // Get current organization
        const org = await prisma.organization.findUnique({
            where: { id: orgId }
        });

        if (!org) {
            return { error: "Organización no encontrada" };
        }

        // Check if plan is valid
        const planKey = requestedPlan.toUpperCase() as keyof typeof PLAN_PRICES;
        if (!PLAN_PRICES[planKey]) {
            return { error: "Plan no válido" };
        }

        // [ANTI-DOWNGRADE] Check hierarchy
        const currentPlanKey = (org.plan || 'STARTER').toUpperCase() as keyof typeof PLAN_HIERARCHY;
        const currentRank = PLAN_HIERARCHY[currentPlanKey] || 0;
        const requestedRank = PLAN_HIERARCHY[planKey] || 0;

        if (requestedRank <= currentRank) {
            return { error: `Solo puedes adquirir un plan superior a tu ${org.plan} actual.` };
        }

        // Check if already has a pending request
        const existingRequest = await prisma.upgradeRequest.findFirst({
            where: {
                orgId,
                status: "PENDING"
            }
        });

        if (existingRequest) {
            return { error: "Ya tienes una solicitud pendiente. Por favor espera a que sea procesada." };
        }

        // Create upgrade request
        const request = await prisma.upgradeRequest.create({
            data: {
                orgId,
                requestedPlan: planKey,
                currentPlan: org.plan,
                amountCRC: PLAN_PRICES[planKey],
                paymentMethod: "SINPE",
                status: "PENDING"
            }
        });

        // TODO: Send email notification to admin
        console.log(`[UPGRADE_REQUEST] New request from ${org.name} for ${planKey} plan`);

        return {
            success: true,
            requestId: request.id,
            amount: PLAN_PRICES[planKey],
            sinpeInfo: SINPE_INFO
        };

    } catch (error: any) {
        console.error("[UPGRADE_REQUEST_ERROR]", error);
        return { error: error.message || "Error al crear solicitud" };
    }
}

/**
 * Upload payment proof (comprobante) for an upgrade request
 */
export async function uploadPaymentProof(requestId: string, proofData: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: "No autorizado" };
    }

    const user = session.user as any;

    try {
        // Verify request belongs to user's org
        const request = await prisma.upgradeRequest.findFirst({
            where: {
                id: requestId,
                orgId: user.orgId,
                status: "PENDING"
            }
        });

        if (!request) {
            return { error: "Solicitud no encontrada o ya procesada" };
        }

        // Update with proof
        await prisma.upgradeRequest.update({
            where: { id: requestId },
            data: { paymentProof: proofData }
        });

        return { success: true };

    } catch (error: any) {
        console.error("[UPLOAD_PROOF_ERROR]", error);
        return { error: error.message };
    }
}

export async function getMyUpgradeRequest() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return null;
    }

    const user = session.user as any;

    // Obtener la solicitud más reciente (sea pendiente, aprobada o rechazada)
    return prisma.upgradeRequest.findFirst({
        where: {
            orgId: user.orgId
        },
        orderBy: { createdAt: 'desc' }
    });
}

// ============ ADMIN ACTIONS ============

/**
 * Get all pending upgrade requests (Admin only)
 */
export async function getPendingUpgradeRequests() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: "No autorizado" };
    }

    const user = session.user as any;
    if (user.role !== "ADMIN") {
        return { error: "Acceso denegado" };
    }

    const requests = await prisma.upgradeRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: 'desc' }
    });

    // Get org names for each request
    const enrichedRequests = await Promise.all(
        requests.map(async (req) => {
            const org = await prisma.organization.findUnique({
                where: { id: req.orgId },
                select: { name: true, cedula: true }
            });
            return {
                ...req,
                orgName: org?.name || "Unknown",
                orgCedula: org?.cedula || ""
            };
        })
    );

    return enrichedRequests;
}

/**
 * Approve an upgrade request (Admin only)
 */
export async function approveUpgradeRequest(requestId: string, adminNotes?: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: "No autorizado" };
    }

    const user = session.user as any;
    if (user.role !== "ADMIN") {
        return { error: "Acceso denegado" };
    }

    try {
        // Get the request
        const request = await prisma.upgradeRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return { error: "Solicitud no encontrada" };
        }

        if (request.status !== "PENDING") {
            return { error: "Esta solicitud ya fue procesada" };
        }

        // Update the organization's plan
        await prisma.organization.update({
            where: { id: request.orgId },
            data: {
                plan: request.requestedPlan,
                subscriptionStatus: "active"
            }
        });

        // Mark request as approved
        await prisma.upgradeRequest.update({
            where: { id: requestId },
            data: {
                status: "APPROVED",
                adminNotes,
                processedBy: user.id,
                processedAt: new Date()
            }
        });

        // Log the action
        const { AuditService } = await import("@/lib/security/audit");
        await AuditService.log({
            orgId: request.orgId,
            userId: user.id,
            action: 'SUBSCRIPTION_CHANGE',
            details: {
                action: 'MANUAL_APPROVAL',
                previousPlan: request.currentPlan,
                newPlan: request.requestedPlan,
                approvedBy: user.email
            }
        });

        revalidatePath('/admin/upgrades');

        return { success: true };

    } catch (error: any) {
        console.error("[APPROVE_ERROR]", error);
        return { error: error.message };
    }
}

/**
 * Reject an upgrade request (Admin only)
 */
export async function rejectUpgradeRequest(requestId: string, reason: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: "No autorizado" };
    }

    const user = session.user as any;
    if (user.role !== "ADMIN") {
        return { error: "Acceso denegado" };
    }

    try {
        const request = await prisma.upgradeRequest.findUnique({
            where: { id: requestId }
        });

        if (!request || request.status !== "PENDING") {
            return { error: "Solicitud no encontrada o ya procesada" };
        }

        await prisma.upgradeRequest.update({
            where: { id: requestId },
            data: {
                status: "REJECTED",
                adminNotes: reason,
                processedBy: user.id,
                processedAt: new Date()
            }
        });

        revalidatePath('/admin/upgrades');

        return { success: true };

    } catch (error: any) {
        console.error("[REJECT_ERROR]", error);
        return { error: error.message };
    }
}

/**
 * Manually set a user's plan (Admin only, for special cases)
 */
export async function setOrgPlan(orgId: string, plan: string, status: string = "active") {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: "No autorizado" };
    }

    const user = session.user as any;
    if (user.role !== "ADMIN") {
        return { error: "Acceso denegado" };
    }

    try {
        await prisma.organization.update({
            where: { id: orgId },
            data: {
                plan: plan.toUpperCase(),
                subscriptionStatus: status
            }
        });

        return { success: true };

    } catch (error: any) {
        console.error("[SET_PLAN_ERROR]", error);
        return { error: error.message };
    }
}
