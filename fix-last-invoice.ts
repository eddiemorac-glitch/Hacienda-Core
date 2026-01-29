import { prisma } from './lib/db';

async function fixInvoice() {
    console.log('🔧 Reparando montos de la factura anterior...');

    const clave = '50628012600000000000000100001010000000022169513539';
    const inv = await prisma.invoice.findFirst({ where: { clave } });

    if (!inv) return;

    const docData: any = inv.docData || {};

    // Corregir detalles
    if (docData.detalles && docData.detalles[0]) {
        docData.detalles[0].precioUnitario = 10000;
        docData.detalles[0].montoTotal = 10000;
        docData.detalles[0].subTotal = 10000;
        docData.detalles[0].impuesto.monto = 1300;
        docData.detalles[0].montoTotalLinea = 11300;
    }

    // Corregir resumen
    docData.resumen = {
        codigoMoneda: "CRC",
        totalVenta: 10000,
        totalGravado: 10000,
        totalExento: 0,
        totalExonerado: 0,
        totalVentaNeta: 10000,
        totalImpuesto: 1300,
        totalComprobante: 11300,
        totalDescuentos: 0
    };

    await prisma.invoice.update({
        where: { id: inv.id },
        data: {
            totalVenta: 10000,
            totalImpuesto: 1300,
            totalComprobante: 11300,
            docData: docData
        }
    });

    console.log('✅ Factura reparada. ¡Ya puedes descargar el PDF!');
    await prisma.$disconnect();
}

fixInvoice();
