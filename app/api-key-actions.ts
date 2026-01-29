
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
    const session = await getServerSession(getAuthOptions());
    if (!session || !(session.user as any).orgId) throw new Error("No autenticado");

    const orgId = (session.user as any).orgId;

    const rawKey = await ApiKeyService.generate(orgId, name);

    revalidatePath("/dashboard/api");
    return { success: true, key: rawKey };
}

export async function deleteApiKey(id: string) {
    const session = await getServerSession(getAuthOptions());
    if (!session || !(session.user as any).orgId) throw new Error("No autenticado");

    const orgId = (session.user as any).orgId;

    await prisma.apiKey.deleteMany({
        where: { id, orgId }
    });

    revalidatePath("/dashboard/api");
    return { success: true };
}

export async function getApiKeys() {
    const session = await getServerSession(getAuthOptions());
    if (!session || !(session.user as any).orgId) return [];

    const orgId = (session.user as any).orgId;

    return await prisma.apiKey.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getApiUsage() {
    const session = await getServerSession(getAuthOptions());
    if (!session || !(session.user as any).orgId) return [];

    const orgId = (session.user as any).orgId;

    return await prisma.apiUsage.findMany({
        where: { orgId },
        take: 30,
        orderBy: { date: 'desc' }
    });
}
