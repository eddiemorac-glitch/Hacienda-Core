import { prisma } from './lib/db';

async function inspectInvoices() {
    console.log("🔍 Investigando facturas recientes...");
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                clave: true,
                consecutivo: true,
                receptorNombre: true,
                totalComprobante: true,
                estado: true,
                createdAt: true,
                mensajeHacienda: true,
                docData: true
            }
        });

        console.log("--- RESULTADOS ---");
        invoices.forEach(inv => {
            console.log(`ID: ${inv.id}`);
            console.log(`Fecha: ${inv.createdAt}`);
            console.log(`Receptor: ${inv.receptorNombre}`);
            console.log(`Total: ${inv.totalComprobante}`);
            console.log(`Estado: ${inv.estado}`);
            console.log(`Clave: ${inv.clave}`);
            // If docData exists, let's see a bit of it
            if (inv.docData) {
                const data = inv.docData as any;
                console.log(`Líneas: ${data.detalles?.length || 0}`);
            }
            console.log("-------------------");
        });
    } catch (error) {
        console.error("❌ Error al inspeccionar:", error);
    } finally {
        await prisma.$disconnect();
    }
}

inspectInvoices();
