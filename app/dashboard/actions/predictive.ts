
'use server';

import { CABYS_MOCK, CabysItem } from '@/lib/hacienda/cabys-data';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth-options";

/**
 * [SENTINEL - PREDICTIVE ENGINE]
 * Server actions to facilitate pre-fetching of heavy catalogs.
 */

export async function getCabysCatalog(): Promise<CabysItem[]> {
    // Artificial latency simulation to demonstrate the benefit of pre-fetching
    await new Promise(resolve => setTimeout(resolve, 500));
    return CABYS_MOCK;
}

export async function getClientHistory(): Promise<any[]> {
    const session = await getServerSession(getAuthOptions());
    if (!session || !(session.user as any).orgId) return [];

    const orgId = (session.user as any).orgId;

    // Fetch unique clients from previous invoices to suggest them in the form
    const clients = await prisma.invoice.findMany({
        where: { orgId },
        distinct: ['receptorCedula'],
        select: {
            receptorNombre: true,
            receptorCedula: true,
            receptorCorreo: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
    });

    return clients;
}
