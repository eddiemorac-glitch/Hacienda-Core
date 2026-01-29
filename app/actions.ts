
'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth-options";
import { DocumentService, DocumentState } from '@/lib/hacienda/document-service';
import { FacturaData, RepData } from '@/lib/types/factura';
import { HaciendaClient } from '@/lib/hacienda/api-client';
import { WebhookService } from '@/lib/hacienda/webhook-service';

/**
 * [WEB UI WRAPPERS] - Server Actions for the Frontend
 * These actions bridge the UI with the core Hacienda Services.
 */

export async function processDocument(
    formData: FormData,
    docData: FacturaData | RepData,
    type: 'FE' | 'REP' | 'FEC' = 'FE'
): Promise<DocumentState> {
    try {
        const session = await getServerSession(getAuthOptions());
        const orgIdFromSession = session?.user?.orgId;

        const isSimulator = process.env.HACIENDA_ENV === 'simulator';
        const orgId = orgIdFromSession || (isSimulator ? (await prisma.organization.findFirst())?.id : null);

        if (!orgId) {
            throw new Error("No tienes una sesión activa o no perteneces a una organización.");
        }

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                haciendaUser: true,
                haciendaPass: true,
                haciendaPin: true,
                haciendaP12: true
            }
        });

        const p12File = formData.get('p12') as File;
        const pin = formData.get('pin') as string;
        const haciendaUser = formData.get('haciendaUser') as string;
        const haciendaPass = formData.get('haciendaPass') as string;

        const { decrypt } = await import("@/lib/security/crypto");

        let finalP12: any = p12File || (org?.haciendaP12 ? Buffer.from(org.haciendaP12, 'base64') : null);
        let finalPin = pin || (org?.haciendaPin ? decrypt(org.haciendaPin) : null);
        let finalUser = haciendaUser || org?.haciendaUser;
        let finalPass = haciendaPass || (org?.haciendaPass ? decrypt(org.haciendaPass) : null);

        if (isSimulator) {
            finalPin = finalPin || "1234";
            finalUser = finalUser || "cpf-01-0000";
            finalPass = finalPass || "mock_pass";
        }

        if (!finalP12 || !finalPin || !finalUser || !finalPass) {
            throw new Error("Credenciales de Hacienda incompletas.");
        }

        return await DocumentService.executeWorkflow({
            orgId,
            docData,
            type,
            security: {
                p12File: p12File ? p12File : undefined,
                p12Buffer: !p12File && Buffer.isBuffer(finalP12) ? (finalP12 as Buffer) : undefined,
                pin: finalPin,
                haciendaUser: finalUser,
                haciendaPass: finalPass,
            }
        });

    } catch (error: any) {
        console.error('[CRITICAL] Action breakdown:', error);
        return { status: 'error', message: error.message || 'Error de sesión o permisos.' };
    }
}

export async function checkInvoiceStatus(invoiceId: string, credentials: { user: string, pass: string }) {
    try {
        const session = await getServerSession(getAuthOptions());
        if (!session || !(session.user as any).orgId) throw new Error("No autenticado");
        const orgId = (session.user as any).orgId;

        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, orgId: orgId }
        });

        if (!invoice) throw new Error('Documento no encontrado');

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { haciendaEnv: true }
        });

        const client = new HaciendaClient({
            username: credentials.user,
            password: credentials.pass,
            environment: (org?.haciendaEnv as any) || 'staging'
        });
        const tokenData = await client.getToken();
        const statusResponse = await client.getStatus(invoice.clave, tokenData.access_token);
        const nuevoEstado = (statusResponse['ind-estado'] || 'procesando').toUpperCase();

        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { estado: nuevoEstado, mensajeHacienda: JSON.stringify(statusResponse) }
        });

        await WebhookService.notifyStatusChange(orgId, invoice.clave, nuevoEstado, statusResponse);

        return { success: true, status: nuevoEstado, response: statusResponse };
    } catch (e: any) {
        console.error("Status Check Error:", e);
        return { success: false, error: e.message };
    }
}

export async function syncContingencyQueue(credentials: { user: string, pass: string }) {
    try {
        const session = await getServerSession(getAuthOptions());
        if (!session || !(session.user as any).orgId) throw new Error("No autenticado");
        const orgId = (session.user as any).orgId;

        const { ContingenciaService } = await import('@/lib/hacienda/contingencia');
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { haciendaEnv: true }
        });

        const client = new HaciendaClient({
            username: credentials.user,
            password: credentials.pass,
            environment: (org?.haciendaEnv as any) || 'staging'
        });

        await ContingenciaService.procesarCola(orgId, async (xml: string, clave: string) => {
            const tokenData = await client.getToken();
            const invoiceRecord = await prisma.invoice.findUnique({ where: { clave } });
            const emisor = invoiceRecord?.emisorCedula || "3101123456";
            const receptor = invoiceRecord?.receptorCedula;

            try {
                await client.sendInvoice(xml, tokenData.access_token, clave, emisor, receptor || undefined);
                return true;
            } catch (e) { return false; }
        });

        return { success: true };
    } catch (e: any) {
        console.error("Sync Error:", e);
        return { success: false, error: e.message };
    }
}
