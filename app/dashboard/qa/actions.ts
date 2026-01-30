
'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth-options";
import { processDocument } from "@/app/actions";
import { DocumentState } from "@/lib/hacienda/document-service";
import { setMockMode } from "@/lib/testing/hacienda-simulator";
import { HaciendaClient } from "@/lib/hacienda/api-client";
import { decrypt } from "@/lib/security/crypto";

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
        claveStr: "",
        consecutivoStr: "",
        fechaEmision: new Date(),
        codigoActividad: "721001", // v4.4 Top level
        emisor: { nombre: "QA TEST TERMINATOR", tipoIdentificacion: "01", numeroIdentificacion: "3101000000", codigoActividad: "721001", correo: "qa@sentinel.com" },
        receptor: { nombre: "GHOST CLIENT", tipoIdentificacion: "01", numeroIdentificacion: "111111111", codigoActividad: "721001", correo: "ghost@client.com" },
        condicionVenta: "01",
        medioPago: ["05"], // SINPE Móvil v4.4
        detalles: [{
            numeroLinea: 1,
            codigoCabys: "8314100000000",
            cantidad: 1,
            unidadMedida: "Unid",
            detalle: "QA v4.4 Stress Test",
            precioUnitario: 1000,
            montoTotal: 1000,
            descuento: {
                monto: 100,
                naturaleza: "06" // Descuento por fidelidad v4.4
            },
            subTotal: 900,
            montoTotalLinea: 1017,
            impuesto: { codigo: "01", codigoTarifa: "08", tarifa: 13, monto: 117 }
        }],
        resumen: {
            codigoMoneda: "CRC",
            totalVenta: 1000,
            totalImpuesto: 117,
            totalComprobante: 1017,
            totalDescuentos: 100,
            totalVentaNeta: 900,
            totalGravado: 900,
            totalExento: 0,
            totalExonerated: 0,
            totalServiciosGravados: 0,
            totalServiciosExentos: 0,
            totalServiciosExonerados: 0,
            totalMercanciasGravadas: 900,
            totalMercanciasExentas: 0,
            totalMercanciasExoneradas: 0
        }
    };

    // Stress test: 5 documents in parallel
    // This MUST trigger the Mutex for at least 4 of them since docData is identical.
    const tasks = Array(5).fill(null).map(() => processDocument(formData, docData as any, 'FE'));

    return await Promise.all(tasks);
}

export async function getLastInvoiceClave() {
    const session = await getServerSession(getAuthOptions());
    if (!session || !(session.user as any).orgId) throw new Error("Unauthorized");
    const orgId = (session.user as any).orgId;

    const lastInvoice = await prisma.invoice.findFirst({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        select: { clave: true }
    });

    return lastInvoice?.clave || null;
}

export async function queryHaciendaStatus(clave: string) {
    try {
        const session = await getServerSession(getAuthOptions());
        if (!session || !(session.user as any).orgId) throw new Error("Unauthorized");
        const orgId = (session.user as any).orgId;

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                haciendaUser: true,
                haciendaPass: true,
                haciendaEnv: true
            }
        });

        if (!org?.haciendaUser || !org?.haciendaPass) {
            throw new Error("Credenciales de Hacienda no configuradas en la organización.");
        }

        const password = decrypt(org.haciendaPass);

        const client = new HaciendaClient({
            username: org.haciendaUser,
            password: password,
            environment: (org.haciendaEnv as any) || 'staging'
        });

        const token = await client.getToken();
        const status = await client.getStatus(clave, token.access_token);

        return { success: true, status };
    } catch (e: any) {
        console.error("QA Status Query Error:", e);
        return { success: false, error: e.message };
    }
}
