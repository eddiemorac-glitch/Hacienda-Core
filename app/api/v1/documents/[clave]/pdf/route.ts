
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PdfService } from "@/lib/pdf-service";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth-options";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ clave: string }> }
) {
    try {
        const session = await getServerSession(getAuthOptions());
        if (!session || !(session.user as any).orgId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const { clave } = await params;
        const orgId = (session.user as any).orgId;

        // Fetch invoice from DB
        const invoice = await prisma.invoice.findFirst({
            where: { clave, orgId },
            include: { organization: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
        }

        // [DEBUG] Logs detallados para diagnóstico en terminal
        const data: any = invoice.docData || {};
        console.log(`[PDF_SYSTEM] Generando PDF para Clave: ${clave}`);

        const pdfData = {
            clave: invoice.clave,
            consecutivo: invoice.consecutivo,
            fechaEmision: invoice.fechaEmision || invoice.createdAt,
            emisor: {
                nombre: invoice.emisorNombre || invoice.organization?.name || "Emisor",
                identificacion: invoice.emisorCedula || "ID-EMISOR",
                direccion: data.emisor?.ubicacion?.senas || "Costa Rica"
            },
            receptor: {
                nombre: invoice.receptorNombre || "Cliente Contado",
                identificacion: invoice.receptorCedula || "ID-RECEPTOR",
                correo: invoice.receptorCorreo || undefined
            },
            items: (data.detalles && Array.isArray(data.detalles)) ? data.detalles.map((d: any) => ({
                detalle: String(d.detalle || "Servicio"),
                precioUnitario: Number(d.montoUnitario || d.precioUnitario || 0).toLocaleString('es-CR'),
                montoTotal: Number(d.montoTotalLinea || d.montoTotal || 0).toLocaleString('es-CR')
            })) : [
                {
                    detalle: "Servicios Profesionales de Facturación",
                    precioUnitario: Number(invoice.totalComprobante || 0).toLocaleString('es-CR'),
                    montoTotal: Number(invoice.totalComprobante || 0).toLocaleString('es-CR')
                }
            ],
            resumen: {
                totalVenta: Number(invoice.totalVenta || 0).toLocaleString('es-CR'),
                totalImpuesto: Number(invoice.totalImpuesto || 0).toLocaleString('es-CR'),
                totalComprobante: Number(invoice.totalComprobante || 0).toLocaleString('es-CR')
            }
        };

        const pdfBuffer = await PdfService.generateInvoice(pdfData);

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Factura-${clave}.pdf"`,
                "Cache-Control": "no-store, max-age=0"
            }
        });

    } catch (error: any) {
        console.error("[PDF_SYSTEM_ERROR]", error);
        return new NextResponse(JSON.stringify({
            error: "Error al generar el PDF",
            details: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
