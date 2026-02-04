
'use server';

import { ApiKeyService } from "@/lib/api-key";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * [MONETIZATION CONTROLLER] - API Key Management
 */

export async function createNewApiKey(name: string) {
    console.log(`[API_ACTIONS] ========== CREATE API KEY START ==========`);
    console.log(`[API_ACTIONS] Attempting to create new API Key: "${name}"`);
    try {
        const session = await getServerSession(getAuthOptions());

        // Detailed session logging for debugging
        console.log(`[API_ACTIONS] Session exists: ${!!session}`);
        if (session) {
            console.log(`[API_ACTIONS] User email: ${session.user?.email}`);
            console.log(`[API_ACTIONS] User orgId: ${(session.user as any)?.orgId}`);
            console.log(`[API_ACTIONS] Full session:`, JSON.stringify(session, null, 2));
        } else {
            console.log(`[API_ACTIONS] No session found - user may not be logged in`);
        }

        if (!session || !(session.user as any).orgId) {
            console.error("[API_ACTIONS] ❌ Unauthorized: No session or missing orgId");
            return { success: false, error: "No autenticado o falta orgId en la sesión" };
        }

        const orgId = (session.user as any).orgId;
        console.log(`[API_ACTIONS] ✅ Authorized. Creating key for org: ${orgId}`);

        const rawKey = await ApiKeyService.generate(orgId, name);

        console.log(`[API_ACTIONS] ✅ Key created successfully!`);
        console.log(`[API_ACTIONS] ========== CREATE API KEY END ==========`);
        revalidatePath("/dashboard/api");
        return { success: true, key: rawKey };
    } catch (e: any) {
        console.error("[API_ACTIONS] Error creating API Key:", e);
        return { success: false, error: e.message || "Error al crear la llave" };
    }
}

export async function deleteApiKey(id: string) {
    console.log(`[API_ACTIONS] Attempting to delete API Key: ${id}`);
    try {
        const session = await getServerSession(getAuthOptions());
        if (!session || !(session.user as any).orgId) {
            throw new Error("No autenticado");
        }

        const orgId = (session.user as any).orgId;

        await prisma.apiKey.deleteMany({
            where: { id, orgId }
        });

        console.log(`[API_ACTIONS] Key ${id} deleted successfully`);
        revalidatePath("/dashboard/api");
        return { success: true };
    } catch (e: any) {
        console.error("[API_ACTIONS] Error deleting API Key:", e);
        return { success: false, error: e.message || "Error al eliminar" };
    }
}

export async function getApiKeys() {
    try {
        const session = await getServerSession(getAuthOptions());
        if (!session || !(session.user as any).orgId) return [];

        const orgId = (session.user as any).orgId;

        return await prisma.apiKey.findMany({
            where: { orgId },
            orderBy: { createdAt: 'desc' }
        });
    } catch (e) {
        console.error("[API_ACTIONS] Error fetching API Keys:", e);
        return [];
    }
}

export async function getApiUsage() {
    try {
        const session = await getServerSession(getAuthOptions());
        if (!session || !(session.user as any).orgId) return [];

        const orgId = (session.user as any).orgId;

        return await prisma.apiUsage.findMany({
            where: { orgId },
            take: 30,
            orderBy: { date: 'desc' }
        });
    } catch (e) {
        console.error("[API_ACTIONS] Error fetching API usage:", e);
        return [];
    }
}
