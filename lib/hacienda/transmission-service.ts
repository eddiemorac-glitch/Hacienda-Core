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

        const isGlobalSimulator = process.env.HACIENDA_ENV === 'simulator';
        const isOrgSimulator = org.haciendaEnv === 'simulator';
        const isProduction = org.haciendaEnv === 'production' || process.env.HACIENDA_ENV === 'production';

        // [SURGICAL BYPASS]
        const missingCreds = !org?.haciendaUser || !org?.haciendaPass;
        const forceSimulator = (missingCreds && !isProduction) || isGlobalSimulator || isOrgSimulator;

        if (!forceSimulator && missingCreds) {
            throw new Error("Credenciales de Hacienda no configuradas para esta organización.");
        }

        // 2. Initialize Client
        const finalEnv = forceSimulator ? 'simulator' : (org.haciendaEnv as any || 'staging');
        let username = org.haciendaUser || "cpf-01-0000";
        let password = org.haciendaPass || "mock_pass";
        try {
            if (org.haciendaPass) password = decrypt(org.haciendaPass);
        } catch (e) {
            if (!forceSimulator) throw e;
            password = "mock_pass";
        }

        const client = new HaciendaClient({
            username,
            password,
            environment: finalEnv as any
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

    static async getStatus(orgId: string, clave: string) {
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                haciendaUser: true,
                haciendaPass: true,
                haciendaEnv: true
            }
        });

        const isGlobalSimulator = process.env.HACIENDA_ENV === 'simulator';
        const isOrgSimulator = org?.haciendaEnv === 'simulator';
        const isProduction = org?.haciendaEnv === 'production' || process.env.HACIENDA_ENV === 'production';

        const missingCreds = !org?.haciendaUser || !org?.haciendaPass;
        const forceSimulator = (missingCreds && !isProduction) || isGlobalSimulator || isOrgSimulator;

        if (!forceSimulator && missingCreds) {
            throw new Error("Credenciales de Hacienda no configuradas.");
        }

        const finalEnv = forceSimulator ? 'simulator' : (org?.haciendaEnv as any || 'staging');
        let username = org?.haciendaUser || "cpf-01-0000";
        let password = org?.haciendaPass || "mock_pass";

        try {
            if (org?.haciendaPass) password = decrypt(org.haciendaPass);
        } catch (e) {
            if (!forceSimulator) throw e;
            password = "mock_pass";
        }

        const client = new HaciendaClient({
            username,
            password,
            environment: finalEnv as any
        });

        const tokenData = await client.getToken();
        return await client.getStatus(clave, tokenData.access_token);
    }
}
