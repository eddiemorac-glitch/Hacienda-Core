'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateHaciendaConfig(data: {
    haciendaUser: string;
    haciendaPass: string;
    haciendaPin: string;
    haciendaP12: string;
    haciendaEnv?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).orgId) throw new Error("No autenticado");

    const orgId = (session.user as any).orgId;
    const { encrypt } = await import("@/lib/security/crypto");

    // [FIX] Solo actualizamos los campos que realmente tienen valor
    // Si el usuario no ingresó un nuevo valor, no sobrescribimos el existente
    const updateData: Record<string, string> = {};
    const updatedFields: string[] = [];

    // Usuario siempre se actualiza (no es sensible)
    if (data.haciendaUser) {
        updateData.haciendaUser = data.haciendaUser;
        updatedFields.push('haciendaUser');
    }

    // Password solo se actualiza si el usuario ingresó uno nuevo
    if (data.haciendaPass && data.haciendaPass.trim() !== '') {
        updateData.haciendaPass = encrypt(data.haciendaPass);
        updatedFields.push('haciendaPass');
    }

    // PIN solo se actualiza si el usuario ingresó uno nuevo
    if (data.haciendaPin && data.haciendaPin.trim() !== '') {
        updateData.haciendaPin = encrypt(data.haciendaPin);
        updatedFields.push('haciendaPin');
    }

    // P12 solo se actualiza si el usuario subió un nuevo archivo
    if (data.haciendaP12 && data.haciendaP12.trim() !== '') {
        updateData.haciendaP12 = data.haciendaP12;
        updatedFields.push('haciendaP12');
    }

    // Ambiente siempre se sincroniza si viene
    if (data.haciendaEnv) {
        updateData.haciendaEnv = data.haciendaEnv;
        updatedFields.push('haciendaEnv');
    }

    // Solo hacer el update si hay algo que actualizar
    if (Object.keys(updateData).length > 0) {
        await prisma.organization.update({
            where: { id: orgId },
            data: updateData
        });
    }

    revalidatePath("/dashboard/settings");

    // [LOG] Auditoría de cambio de config
    if (updatedFields.length > 0) {
        const { AuditService } = await import("@/lib/security/audit");
        await AuditService.log({
            orgId,
            userId: (session.user as any).id,
            action: 'CONFIG_UPDATE',
            details: { fields: updatedFields }
        });
    }

    return { success: true, updatedFields };
}

export async function updateBrandingConfig(data: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).orgId) throw new Error("No autenticado");

    const orgId = (session.user as any).orgId;

    // Validar que sea Enterprise para usar estas perillas
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { plan: true }
    });

    if (org?.plan !== 'ENTERPRISE' && (session.user as any).role !== 'ADMIN') {
        throw new Error("Función exclusiva del Plan ENTERPRISE");
    }

    const updated = await prisma.organization.update({
        where: { id: orgId },
        data: {
            logoUrl: data.logoUrl,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            accentColor: data.accentColor,
        }
    });

    revalidatePath("/dashboard/settings");

    // [LOG] Auditoría
    const { AuditService } = await import("@/lib/security/audit");
    await AuditService.log({
        orgId,
        userId: (session.user as any).id,
        action: 'BRANDING_UPDATE',
        details: { branding: data }
    });

    return { success: true };
}
