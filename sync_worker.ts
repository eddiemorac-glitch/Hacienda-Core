import { prisma } from "./lib/db";
import { ContingenciaService } from "./lib/hacienda/contingencia";
import { TransmissionService } from "./lib/hacienda/transmission-service";

/**
 * [SENTINEL WORKER] - Recovery Engine
 * Periodically checks the contingency queue and attempts to clear it.
 */

async function runWorker() {
    console.log("[WORKER] Sentinel Sync Worker Iniciado...");

    while (true) {
        try {
            // 1. Obtener todas las organizaciones que tienen pendientes en cola
            const orgsWithPending = await prisma.contingencyQueue.findMany({
                where: { status: 'PENDING' },
                select: { orgId: true },
                distinct: ['orgId']
            });

            for (const { orgId } of orgsWithPending) {
                console.log(`[WORKER] Revisando cola para Org: ${orgId}`);

                await ContingenciaService.procesarCola(orgId, async (xml, clave) => {
                    // Buscar datos faltantes en la tabla de facturas
                    const invoice = await prisma.invoice.findUnique({ where: { clave } });
                    if (!invoice) return false;

                    try {
                        const res = await TransmissionService.transmit({
                            orgId,
                            xmlSigned: xml,
                            clave,
                            emisorCedula: invoice.emisorCedula,
                            receptorCedula: invoice.receptorCedula || undefined
                        });

                        // [FIX] Si el envío es exitoso, actualizamos la tabla Invoice también
                        await prisma.invoice.update({
                            where: { clave },
                            data: {
                                estado: 'ENVIADO',
                                mensajeHacienda: JSON.stringify(res)
                            }
                        });

                        return true;
                    } catch (e: any) {
                        console.error(`[WORKER] Error transmitiendo ${clave}: ${e.message}`);
                        return false;
                    }
                });
            }

        } catch (error) {
            console.error("[WORKER] Error crítico en ciclo de sincronización:", error);
        }

        // Wait 5 minutes before next run
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
}

runWorker();
