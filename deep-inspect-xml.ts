import { prisma } from './lib/db';

async function deepInspect() {
    const inv = await prisma.invoice.findFirst({
        where: { clave: '50628012600000000000000100001010000000022169513539' },
        select: { xmlFirmado: true }
    });

    if (inv && inv.xmlFirmado) {
        console.log('\n--- LINEAS DE DETALLE EN EL XML ---');
        const lines = inv.xmlFirmado.match(/<LineaDetalle>[\s\S]*?<\/LineaDetalle>/g);
        lines?.forEach((l, i) => console.log(`Línea ${i + 1}:\n${l}\n`));

        console.log('\n--- RESUMEN EN EL XML ---');
        // En v4.4 es ResumenFactura
        const resumen = inv.xmlFirmado.match(/<ResumenFactura>[\s\S]*?<\/ResumenFactura>/g);
        console.log(resumen ? resumen[0] : '❌ No se encontró etiqueta ResumenFactura');
    }
    await prisma.$disconnect();
}

deepInspect();
