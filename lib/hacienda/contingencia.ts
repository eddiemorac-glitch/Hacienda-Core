import { prisma } from "@/lib/db";

/**
 * SERVICIO DE CONTINGENCIA
 * 
 * Reglas v4.4:
 * 1. Si falla Hacienda, guardar XML en Base de Datos.
 * 2. Un Worker (Cron Job) reintenta periódicamente.
 */

export class ContingenciaService {

    static async encolar(xmlSigned: string, clave: string, error: string, orgId: string) {
        console.log(`[CONTINGENCIA] Persistiendo factura ${clave} en DB. Org: ${orgId}. Error: ${error}`);
        try {
            await prisma.contingencyQueue.create({
                data: {
                    orgId,
                    clave,
                    xmlSigned,
                    errorLog: error,
                    status: 'PENDING'
                }
            });
        } catch (e: any) {
            console.error('CRITICAL: Fallo al guardar en contingencia DB', e);
        }
    }

    static async obtenerPendientes(orgId: string) {
        return await prisma.contingencyQueue.findMany({
            where: {
                status: 'PENDING',
                orgId: orgId,
                nextRetryAt: { lte: new Date() }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    static async procesarCola(orgId: string, sendFunction: (xml: string, clave: string) => Promise<boolean>) {
        const pendientes = await this.obtenerPendientes(orgId);
        if (pendientes.length === 0) return;

        console.log(`[WORKER] Procesando ${pendientes.length} documentos pendientes de DB...`);

        for (const item of pendientes) {
            try {
                const enviado = await sendFunction(item.xmlSigned, item.clave);
                if (enviado) {
                    console.log(`[WORKER] Documento ${item.clave} recuperado y enviado.`);
                    await prisma.contingencyQueue.update({
                        where: { id: item.id },
                        data: { status: 'PROCESSED' }
                    });
                } else {
                    throw new Error("Rechazo explícito del servidor");
                }
            } catch (e: any) {
                console.error(`[WORKER] Fallo reintento ${item.clave}: ${e.message}`);

                const backoffMinutes = Math.pow(2, item.intentos + 1);
                const nextRetry = new Date();
                nextRetry.setMinutes(nextRetry.getMinutes() + backoffMinutes);

                if (item.intentos < 5) {
                    await prisma.contingencyQueue.update({
                        where: { id: item.id },
                        data: {
                            intentos: { increment: 1 },
                            errorLog: e.message,
                            nextRetryAt: nextRetry
                        }
                    });
                } else {
                    console.error(`[WORKER] Documento ${item.clave} DESCARTADO tras 5 intentos.`);
                    await prisma.contingencyQueue.update({
                        where: { id: item.id },
                        data: { status: 'FAILED', errorLog: 'Max retries exceeded' }
                    });
                }
            }
        }
    }
}
