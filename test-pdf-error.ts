import { PdfService } from './lib/pdf-service';
import { prisma } from './lib/db';

async function testPdf() {
    console.log('🧪 Iniciando prueba de generación de PDF...');

    try {
        const invoice = await prisma.invoice.findFirst({
            where: { clave: '50628012600000000000000100001010000000022169513539' }
        });

        if (!invoice) {
            console.error('❌ Factura no encontrada');
            return;
        }

        const data = (invoice.docData as any) || {};

        const pdfData = {
            clave: invoice.clave,
            consecutivo: invoice.consecutivo,
            fechaEmision: invoice.fechaEmision,
            emisor: {
                nombre: invoice.emisorNombre,
                identificacion: invoice.emisorCedula,
                direccion: data.emisor?.ubicacion?.senas || "Costa Rica"
            },
            receptor: {
                nombre: invoice.receptorNombre,
                identificacion: invoice.receptorCedula,
                correo: invoice.receptorCorreo || undefined
            },
            items: data.detalles?.map((d: any) => ({
                codigo: d.codigoCabys || "N/A",
                detalle: d.detalle,
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
                montoTotal: d.montoTotal,
                montoImpuesto: d.impuesto?.monto || 0,
                montoNeto: d.montoTotalLinea
            })) || [],
            resumen: {
                moneda: invoice.moneda || 'CRC',
                totalVenta: Number(invoice.totalVenta),
                totalVentaNeta: Number(invoice.totalVenta),
                totalImpuesto: Number(invoice.totalImpuesto),
                totalComprobante: Number(invoice.totalComprobante),
                totalServGravados: Number(invoice.totalVenta),
                totalServExentos: 0,
                totalServExonerados: 0,
                totalMercanciasGravadas: 0,
                totalMercanciasExentas: 0,
                totalMercanciasExoneradas: 0,
                totalGravado: Number(invoice.totalVenta),
                totalExento: 0,
                totalExonerado: 0,
                totalDescuentos: 0
            }
        };

        console.log('📦 Datos preparados. Generando...');
        const buffer = await PdfService.generateInvoice(pdfData as any);
        console.log(`✅ ¡ÉXITO! PDF generado: ${buffer.length} bytes`);

    } catch (err: any) {
        console.error('❌ ERROR DETECTADO:');
        console.error('Mensaje:', err.message);
        console.error('Stack:', err.stack);
    }

    await prisma.$disconnect();
}

testPdf();
