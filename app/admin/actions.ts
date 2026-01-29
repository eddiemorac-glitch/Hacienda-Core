'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getGlobalAdminStats() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
        throw new Error("No autorizado");
    }

    const [
        totalInvoices,
        totalOrgs,
        totalUsers,
        pendingUpgrades,
        recentInvoices
    ] = await Promise.all([
        prisma.invoice.count(),
        prisma.organization.count(),
        prisma.user.count(),
        prisma.upgradeRequest.count({ where: { status: 'PENDING' } }),
        prisma.invoice.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                clave: true,
                totalComprobante: true,
                estado: true,
                createdAt: true,
                organization: {
                    select: { name: true }
                }
            }
        })
    ]);

    // Calcular facturación total estimada (sumando totalComprobante de facturas aceptadas/enviadas)
    const revenueStats = await prisma.invoice.aggregate({
        where: {
            estado: { in: ['ACEPTADO', 'ENVIADO'] }
        },
        _sum: {
            totalComprobante: true
        }
    });

    return {
        totalInvoices,
        totalOrgs,
        totalUsers,
        pendingUpgrades,
        totalRevenue: revenueStats._sum.totalComprobante || 0,
        recentInvoices
    };
}

export async function getAllOrganizations() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
        throw new Error("No autorizado");
    }

    return await prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { invoices: true, users: true }
            }
        }
    });
}
