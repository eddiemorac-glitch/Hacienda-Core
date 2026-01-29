import { prisma } from './lib/db';

async function findInvoice() {
    const inv = await prisma.invoice.findFirst({
        where: {
            clave: { contains: '50628012600000000000000100001010000000022' }
        },
        select: {
            id: true,
            clave: true,
            estado: true,
            emisorNombre: true,
            receptorNombre: true,
            totalComprobante: true,
            xmlFirmado: true
        }
    });

    if (inv) {
        console.log('\n✅ FACTURA ENCONTRADA EN BASE DE DATOS\n');
        console.log(`ID: ${inv.id}`);
        console.log(`Clave: ${inv.clave}`);
        console.log(`Estado: ${inv.estado}`);
        console.log(`Emisor: ${inv.emisorNombre}`);
        console.log(`Receptor: ${inv.receptorNombre}`);
        console.log(`Total: ¢${inv.totalComprobante}`);
        console.log(`XML Firmado: ${inv.xmlFirmado ? '✅ SI (' + inv.xmlFirmado.length + ' chars)' : '❌ NO'}`);
    } else {
        console.log('\n❌ Factura no encontrada');
    }

    await prisma.$disconnect();
}

findInvoice();
