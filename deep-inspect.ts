import { prisma } from './lib/db';

async function deepInspect() {
    console.log("🔍 Análisis Quirúrgico de 'Prueba 3'...");
    try {
        const invoices = await prisma.invoice.findMany({
            where: {
                OR: [
                    { receptorNombre: { contains: 'Prueba 3', mode: 'insensitive' } },
                    { receptorNombre: { contains: 'Prueba 2', mode: 'insensitive' } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                totalComprobante: true,
                docData: true,
                createdAt: true,
                estado: true
            }
        });

        invoices.forEach(inv => {
            console.log(`--- FACTURA ${inv.id} ---`);
            console.log(`Fecha: ${inv.createdAt}`);
            console.log(`Total: ${inv.totalComprobante}`);
            console.log(`Estado: ${inv.estado}`);
            console.log(`Data JSON: ${JSON.stringify(inv.docData).substring(0, 200)}...`);
            console.log("------------------------");
        });

    } catch (e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}

deepInspect();
