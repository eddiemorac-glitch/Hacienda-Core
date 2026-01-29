import { prisma } from './lib/db';

async function inspectXml() {
    const inv = await prisma.invoice.findFirst({
        where: {
            clave: '50628012600000000000000100001010000000022169513539'
        },
        select: {
            xmlFirmado: true,
            totalComprobante: true,
            totalVenta: true,
            totalImpuesto: true,
            docData: true
        }
    });

    if (inv && inv.xmlFirmado) {
        console.log('\n--- DATOS EN BASE DE DATOS ---');
        console.log('Total Comprobante:', inv.totalComprobante);
        console.log('Total Venta:', inv.totalVenta);
        console.log('Total Impuesto:', inv.totalImpuesto);

        console.log('\n--- XML DECODIFICADO (Primeros 1500 chars) ---');
        // El XML no está en base64 en la DB, es un string
        console.log(inv.xmlFirmado.substring(0, 1500));

        console.log('\n--- COMPARACIÓN CON DOCDATA ---');
        const docData = inv.docData as any;
        console.log('Resumen en docData:', JSON.stringify(docData?.resumen, null, 2));
    } else {
        console.log('\n❌ Factura no encontrada o no tiene XML');
    }

    await prisma.$disconnect();
}

inspectXml();
