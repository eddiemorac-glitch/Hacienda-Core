import { HaciendaClient } from "./api-client";
import { prisma } from "@/lib/db";
import { decrypt } from "../security/crypto";

/**
 * [SWARM TRANSMISSION] - Core Logic for Hacienda Communication
 * Decoupled from actions to allow re-use in Workers and API.
 */

export class TransmissionService {

    static async transmit(params: {
        orgId: string;
        xmlSigned: string;
        clave: string;
        emisorCedula: string;
        receptorCedula?: string;
    }) {
        // 1. Recover organization secrets
        const org = await prisma.organization.findUnique({
            where: { id: params.orgId },
            select: {
                haciendaUser: true,
                haciendaPass: true,
                haciendaEnv: true
            }
        });

        if (!org) {
            throw new Error(`Organización ${params.orgId} no encontrada.`);
        }

        if (org.haciendaEnv !== 'simulator' && (!org?.haciendaUser || !org?.haciendaPass)) {
            throw new Error("Credenciales de Hacienda no configuradas para esta organización.");
        }

        // 2. Initialize Client
        let password = org.haciendaPass || "mock_pass";
        try {
            if (org.haciendaPass) password = decrypt(org.haciendaPass);
        } catch (e) {
            if (org.haciendaEnv !== 'simulator') throw e;
        }

        const client = new HaciendaClient({
            username: org.haciendaUser || "cpf-01-0000",
            password: password,
            environment: (org.haciendaEnv as any) || 'staging'
        });

        // 3. Send
        const tokenData = await client.getToken();
        const response = await client.sendInvoice(
            params.xmlSigned,
            tokenData.access_token,
            params.clave,
            params.emisorCedula,
            params.receptorCedula
        );

        return response;
    }
}
