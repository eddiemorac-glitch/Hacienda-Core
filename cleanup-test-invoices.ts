import { prisma } from './lib/db';

async function cleanupTestInvoices() {
    console.log("🚀 Iniciando limpieza de facturas de prueba en producción...");

    // Lista de IDs de facturas a anular (basado en la descripción del usuario)
    // Opcionalmente podemos buscar facturas con montos en 0 o nombres de prueba

    try {
        const result = await prisma.invoice.updateMany({
            where: {
                OR: [
                    { receptorNombre: 'QA TEST' },
                    { receptorNombre: 'RECEPTOR TEST' },
                    { emisorNombre: 'QA TEST' },
                    { totalComprobante: 0 }
                ],
                estado: { not: 'ANULADA' }
            },
            data: {
                estado: 'ANULADA',
                mensajeHacienda: 'Documento de prueba anulado por mantenimiento de integridad.'
            }
        });

        console.log(`✅ Se han anulado ${result.count} facturas de prueba correctamente.`);
    } catch (error) {
        console.error("❌ Error durante la limpieza:", error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupTestInvoices();
