
'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth-options";
import { processDocument } from "@/app/actions";
import { DocumentState } from "@/lib/hacienda/document-service";
import { setMockMode } from "@/lib/testing/hacienda-simulator";

export async function toggleSimulator(online: boolean) {
    if (online) {
        process.env.HACIENDA_ENV = 'simulator';
    } else {
        process.env.HACIENDA_ENV = 'staging';
    }
    return { success: true, env: process.env.HACIENDA_ENV };
}

export async function runGhostInvoices(isLocalBypass = false) {
    if (!isLocalBypass) {
        const session = await getServerSession(getAuthOptions());
        if (!session || !(session.user as any).orgId) throw new Error("Unauthorized");
    }

    // Si es bypass, buscamos la primera org del sistema para la prueba
    const orgId = isLocalBypass ? (await prisma.organization.findFirst())?.id : (await getServerSession(getAuthOptions()) as any).user.orgId;
    if (!orgId) throw new Error("No organization found for stress test");
    const formData = new FormData();
    formData.append("pin", "1234");
    formData.append("haciendaUser", "cpf-01-0000");
    formData.append("haciendaPass", "pass123");
    // p12 will be fetched from DB via processDocument logic

    const docData = {
        // Campos requeridos por TypeScript (se generan en runtime)
        claveStr: "",
        consecutivoStr: "",
        fechaEmision: new Date(),
        emisor: { nombre: "QA TEST TERMINATOR", tipoIdentificacion: "01", numeroIdentificacion: "3101000000", correo: "qa@sentinel.com" },
        receptor: { nombre: "GHOST CLIENT", tipoIdentificacion: "01", numeroIdentificacion: "111111111", correo: "ghost@client.com" },
        condicionVenta: "01",
        medioPago: ["01"],
        detalles: [{
            numeroLinea: 1,
            codigoCabys: "8314100000000",
            cantidad: 1,
            unidadMedida: "Unid",
            detalle: "QA Stress Test",
            precioUnitario: 1,
            montoTotal: 1,
            subTotal: 1,
            montoTotalLinea: 1.13,
            impuesto: { codigo: "01", codigoTarifa: "08", tarifa: 13, monto: 0.13 }
        }],
        resumen: {
            codigoMoneda: "CRC",
            totalVenta: 1,
            totalImpuesto: 0.13,
            totalComprobante: 1.13,
            totalDescuentos: 0,
            totalVentaNeta: 1,
            totalGravado: 1,
            totalExento: 0,
            totalExonerado: 0,
            totalServiciosGravados: 0,
            totalServiciosExentos: 0,
            totalServiciosExonerados: 0,
            totalMercanciasGravadas: 1,
            totalMercanciasExentas: 0,
            totalMercanciasExoneradas: 0
        }
    };

    const results: DocumentState[] = [];

    // Parallel stress test (3 invoices)
    const tasks = [
        processDocument(formData, docData, 'FE'),
        processDocument(formData, docData, 'FE'),
        processDocument(formData, docData, 'FE')
    ];

    return await Promise.all(tasks);
}
