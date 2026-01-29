'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HaciendaClient } from '@/lib/hacienda/api-client';

export async function getDashboardStats() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).orgId) return { todayCount: 0, totalPending: 0, org: null };
        const orgId = (session.user as any).orgId;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [todayCount, totalPending, totalInvoiceCount, organization] = await Promise.all([
            prisma.invoice.count({ where: { orgId, createdAt: { gte: today } } }),
            prisma.contingencyQueue.count({ where: { orgId, status: 'PENDING' } }),
            prisma.invoice.count({ where: { orgId } }), // [QUOTA TRACKING] Conteo histórico para límites
            prisma.organization.findUnique({
                where: { id: orgId },
                select: {
                    name: true,
                    cedula: true,
                    plan: true,
                    subscriptionStatus: true,
                    stripeCustomerId: true,
                    subscriptionEndsAt: true,
                    haciendaUser: true,
                    haciendaPass: true,
                    haciendaPin: true,
                    haciendaP12: true,
                    haciendaEnv: true,
                    logoUrl: true,
                    primaryColor: true,
                    secondaryColor: true,
                    accentColor: true
                }
            })
        ]);

        // [SECURITY] No exponer valores encriptados completos al frontend
        // Solo indicamos SI están configurados y mostramos el usuario (no sensible)
        const safeOrg = organization ? {
            name: organization.name,
            cedula: organization.cedula,
            plan: organization.plan,
            subscriptionStatus: organization.subscriptionStatus,
            stripeCustomerId: organization.stripeCustomerId,
            subscriptionEndsAt: organization.subscriptionEndsAt,
            haciendaUser: organization.haciendaUser || "",
            haciendaEnv: organization.haciendaEnv || "staging",
            logoUrl: organization.logoUrl || "",
            primaryColor: organization.primaryColor || "#3b82f6",
            secondaryColor: organization.secondaryColor || "#0f172a",
            accentColor: organization.accentColor || "#10b981",
            // Indicadores de configuración (no valores reales)
            hasHaciendaPass: !!organization.haciendaPass,
            hasHaciendaPin: !!organization.haciendaPin,
            hasHaciendaP12: !!organization.haciendaP12
        } : null;

        return {
            todayCount,
            totalInvoiceCount, // [METRIC EXPOSED]
            totalPending,
            org: safeOrg,
            hasHaciendaConfig: !!(organization?.haciendaUser && organization?.haciendaP12 && organization?.haciendaPass && organization?.haciendaPin)
        };
    } catch (e) {
        console.error("Dashboard Stats Error:", e);
        return { todayCount: 0, totalInvoiceCount: 0, totalPending: 0, org: null };
    }
}

export async function getLatestInvoices() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).orgId) return [];
        const orgId = (session.user as any).orgId;

        const invoices = await prisma.invoice.findMany({
            where: { orgId },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        return invoices.map((inv: any) => ({
            ...inv,
            totalVenta: inv.totalVenta.toString(),
            totalImpuesto: inv.totalImpuesto.toString(),
            totalComprobante: inv.totalComprobante.toString()
        }));
    } catch (e) {
        console.error("Latest Invoices Error:", e);
        return [];
    }
}

export async function checkHaciendaHealth() {
    try {
        const start = Date.now();
        const res = await fetch("https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token", {
            method: 'HEAD',
            next: { revalidate: 60 } // Cache health for 1 min
        });
        const duration = Date.now() - start;

        return {
            status: res.ok ? 'online' : 'unstable',
            latency: duration,
            lastChecked: new Date().toISOString()
        };
    } catch (e) {
        return {
            status: 'offline',
            latency: 0,
            lastChecked: new Date().toISOString()
        };
    }
}
