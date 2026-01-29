

import { prisma } from "@/lib/db";

/**
 * [SEQUENCE SERVICE] - Generador de Consecutivos Secuenciales
 * 
 * Hacienda CR v4.4 exige que los consecutivos sean estrictamente secuenciales.
 * Este servicio garantiza atomicidad usando Prisma transactions.
 */

export interface SequenceParams {
    orgId: string;
    sucursal?: string;
    terminal?: string;
    tipoDoc: 'FE' | 'REP' | 'FEC';
}

export async function getNextSequence(params: SequenceParams): Promise<number> {
    const { orgId, sucursal = '001', terminal = '00001', tipoDoc } = params;

    // Upsert atómico para obtener el siguiente número
    const result = await prisma.documentSequence.upsert({
        where: {
            orgId_sucursal_terminal_tipoDoc: {
                orgId,
                sucursal,
                terminal,
                tipoDoc
            }
        },
        update: {
            lastNumber: { increment: 1 }
        },
        create: {
            orgId,
            sucursal,
            terminal,
            tipoDoc,
            lastNumber: 1
        }
    });

    return result.lastNumber;
}

/**
 * Formatea el consecutivo a 8 dígitos con padding de ceros
 */
export function formatSequence(num: number): string {
    return num.toString().padStart(8, '0');
}
