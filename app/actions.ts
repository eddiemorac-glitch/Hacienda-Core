'use server';

import { VaultService } from '@/lib/security/vault';
import { SignerService } from '@/lib/security/signer';
import { XmlFactory } from '@/lib/hacienda/xml-factory';
import { ClaveHacienda, SituacionComprobante, TipoDocumento } from '@/lib/hacienda/clave';
import { HaciendaClient } from '@/lib/hacienda/api-client';
import { FacturaData, RepData } from '@/lib/types/factura';
import { prisma } from '@/lib/db';
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PLANS } from "@/lib/stripe-config";
import { WebhookService } from '@/lib/hacienda/webhook-service';
import { getNextSequence, formatSequence } from '@/lib/hacienda/sequence-service';
import { z } from 'zod';
import { AuditService } from '@/lib/security/audit';

// [ZOD SHIELD] Validation Schemas
const RegisterSchema = z.object({
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    name: z.string().min(3, "Nombre muy corto"),
    orgName: z.string().min(3, "Nombre de organización muy corto"),
    cedula: z.string().regex(/^\d{9,12}$/, "La cédula debe tener entre 9 y 12 dígitos numéricos"),
    plan: z.string().optional()
});

/**
 * [NOVA PROTOCOL] - Central Hub for Document Processing
 * Handles FE (Facturas), REP (Recibos de Pago) and FEC (Facturas de Compra).
 */

export interface DocumentState {
    status: 'idle' | 'processing' | 'success' | 'warning' | 'error';
    message: string;
    clave?: string;
    xmlSigned?: string;
    haciendaResponse?: any;
}

export async function processDocument(
    formData: FormData,
    docData: FacturaData | RepData,
    type: 'FE' | 'REP' | 'FEC' = 'FE'
): Promise<DocumentState> {
    try {
        const session = await getServerSession(authOptions);
        const orgIdFromSession = session?.user?.orgId;

        // [SENTINEL BYPASS] Permite correr pruebas de estress locales sin sesión
        const isSimulator = process.env.HACIENDA_ENV === 'simulator';
        const orgId = orgIdFromSession || (isSimulator ? (await prisma.organization.findFirst())?.id : null);

        if (!orgId) {
            throw new Error("No tienes una sesión activa o no perteneces a una organización.");
        }

        // Recuperar organización para ver si hay credenciales guardadas
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                haciendaUser: true,
                haciendaPass: true,
                haciendaPin: true,
                haciendaP12: true
            }
        });

        const p12File = formData.get('p12') as File;
        const pin = formData.get('pin') as string;
        const haciendaUser = formData.get('haciendaUser') as string;
        const haciendaPass = formData.get('haciendaPass') as string;

        const { decrypt } = await import("@/lib/security/crypto");

        // Lógica de Swarm: Usar lo del form o lo de la DB (desencriptando si viene de DB)
        let finalP12: any = p12File || (org?.haciendaP12 ? Buffer.from(org.haciendaP12, 'base64') : null);
        let finalPin = pin || (org?.haciendaPin ? decrypt(org.haciendaPin) : null);
        let finalUser = haciendaUser || org?.haciendaUser;
        let finalPass = haciendaPass || (org?.haciendaPass ? decrypt(org.haciendaPass) : null);

        // [QA BYPASS] Si estamos probando contra el simulador, inyectamos llave demo si no hay nada
        if (process.env.HACIENDA_ENV === 'simulator') {
            if (!finalP12) finalP12 = Buffer.from("MOCK_P12_CONTENT"); // El VaultService lo manejará o fallará graciosamente
            finalPin = finalPin || "1234";
            finalUser = finalUser || "cpf-01-0000";
            finalPass = finalPass || "mock_pass";
        }

        if (!finalP12 || !finalPin || !finalUser || !finalPass) {
            throw new Error("Credenciales de Hacienda incompletas. Por favor configúrelas en Ajustes o súbalas en este formulario.");
        }

        return await executeDocumentWorkflow({
            orgId,
            docData,
            type,
            security: {
                p12File: p12File ? p12File : undefined,
                p12Buffer: !p12File && Buffer.isBuffer(finalP12) ? (finalP12 as Buffer) : undefined,
                pin: finalPin,
                haciendaUser: finalUser,
                haciendaPass: finalPass,
            }
        });

    } catch (error: unknown) {
        console.error('[CRITICAL] Session breakdown:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error de sesión o permisos.';
        return {
            status: 'error',
            message: errorMessage
        };
    }
}

/**
 * [CORE ENGINE] - Stateless Document Workflow
 * Can be called by UI (processDocument) or Public API.
 */
// [ANTI-DUPLICATE CACHE] Prevents race conditions or double clicks producing duplicate invoices
const recentInvoices = new Set<string>();

export async function executeDocumentWorkflow({
    orgId,
    docData,
    type,
    security
}: {
    orgId: string,
    docData: FacturaData | RepData,
    type: 'FE' | 'REP' | 'FEC',
    security: {
        p12File?: File,
        p12Buffer?: Buffer,
        pin: string,
        haciendaUser: string,
        haciendaPass: string,
    }
}): Promise<DocumentState> {
    try {
        // [INTEGRITY CHECK] Validate common structure
        if (!docData.emisor?.numeroIdentificacion) {
            throw new Error("Estructura inválida: El emisor no tiene identificación.");
        }

        const totalComprobante = (docData as any).resumen?.totalComprobante || (docData as any).montoPago || 0;
        if (totalComprobante <= 0) {
            throw new Error(`Integridad fallida: El monto total (${totalComprobante}) debe ser mayor a cero.`);
        }

        if (type !== 'REP' && (!(docData as any).detalles || (docData as any).detalles.length === 0)) {
            throw new Error("Integridad fallida: El documento debe tener al menos una línea de detalle.");
        }

        if (!docData.receptor?.numeroIdentificacion || !docData.receptor?.nombre) {
            throw new Error("Integridad fallida: Debe completar los datos del receptor (Nombre y Cédula).");
        }

        // [ANTI-ACCIDENTAL DUPLICATION]
        const submissionKey = `${orgId}-${totalComprobante}-${docData.receptor.numeroIdentificacion}`;
        if (recentInvoices.has(submissionKey)) {
            console.warn(`[SENTINEL] Bloqueado intento de duplicación para Org: ${orgId}`);
            throw new Error("Ya se está procesando un documento idéntico. Por favor espere 10 segundos.");
        }
        recentInvoices.add(submissionKey);
        setTimeout(() => recentInvoices.delete(submissionKey), 10000); // 10s cooldown

        console.log(`[FORGE] Ejecutando workflow para documento tipo: ${type} (Org: ${orgId})...`);

        const isSimulator = process.env.HACIENDA_ENV === 'simulator';

        // 1. Quota & Feature Verification (Sentinel Shield)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const currentOrg = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { plan: true, subscriptionStatus: true, haciendaEnv: true, name: true }
        });

        // [INTELLIGENCE] Si el plan es superior pero no está pagado (active/trialing), degradar visualmente a STARTER
        const rawPlan = (currentOrg?.plan || 'STARTER').toUpperCase();
        const subStatus = currentOrg?.subscriptionStatus;

        let effectivePlan = rawPlan;
        if (rawPlan !== 'STARTER' && subStatus !== 'active' && subStatus !== 'trialing') {
            console.warn(`[SENTINEL_SECURITY] Org ${orgId} attempted ${rawPlan} features without active payment. Downgrading context.`);
            effectivePlan = 'STARTER';
        }

        const currentPlan = Object.values(PLANS).find((p) => p.id.toUpperCase() === effectivePlan);

        if (!currentPlan) {
            throw new Error(`[PLAN_NOT_FOUND] No se pudo determinar el plan efectivo para la organización.`);
        }

        // [QUOTA CHECK]
        const docCount = await prisma.invoice.count({
            where: {
                orgId,
                createdAt: { gte: startOfMonth }
            }
        });

        if (docCount >= (currentPlan.quota || 0)) {
            throw new Error(`[QUOTA_EXCEEDED] Has alcanzado el límite de ${currentPlan.quota} documentos mensuales para tu plan ${currentPlan.name}. Por favor mejora tu plan en la sección de Facturación.`);
        }

        // [FEATURE CHECK]
        if (!currentPlan.allowedTypes.includes(type)) {
            throw new Error(`[FEATURE_RESTRICTED] Tu plan ${currentPlan.name} solo permite emitir documentos de tipo: ${currentPlan.allowedTypes.join(', ')}. Mejora a Business o Enterprise para desbloquear REP y FEC.`);
        }

        // 2. Vault Unlock (Final Step before generation)
        let p12Buffer: Buffer;
        if (isSimulator) {
            p12Buffer = Buffer.from(""); // Dummy
        } else if (security.p12Buffer) {
            p12Buffer = security.p12Buffer;
        } else if (security.p12File) {
            p12Buffer = Buffer.from(await security.p12File.arrayBuffer());
        } else {
            throw new Error('Certificado P12 no proporcionado.');
        }

        // Solo desbloquear si no es simulador
        const keyData = !isSimulator ? VaultService.unlock({ p12Buffer, pin: security.pin }) : null;

        // [SIMULATOR BYPASS] Inject mock credentials for transmission if simulator is on
        const finalSecurity = isSimulator ? {
            ...security,
            haciendaUser: security.haciendaUser || "cpf-01-0000",
            haciendaPass: security.haciendaPass || "mock_pass"
        } : security;

        // 3. Identity & Sequence Management (v4.4)
        const now = new Date();

        // [VALIDATION] Basic structural check before generation
        if (!docData.emisor?.numeroIdentificacion) {
            throw new Error("El emisor debe tener un número de identificación.");
        }

        const sequenceNumber = await getNextSequence({ orgId, tipoDoc: type });
        const consecutivo = formatSequence(sequenceNumber);

        const tipoHacienda = type === 'FEC' ? TipoDocumento.FacturaElectronicaCompra :
            (type === 'REP' ? TipoDocumento.ReciboElectronicoPago : TipoDocumento.FacturaElectronica);

        // El código de seguridad SÍ puede ser aleatorio
        const codigoSeguridad = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');

        const claveStr = ClaveHacienda.generar({
            sucursal: '001',
            terminal: '00001',
            tipo: tipoHacienda,
            consecutivo: consecutivo,
            cedulaEmisor: docData.emisor.numeroIdentificacion,
            situacion: SituacionComprobante.Normal,
            codigoSeguridad: codigoSeguridad
        }, now);

        const consecutivoFull = ClaveHacienda.generarConsecutivo({
            sucursal: '001',
            terminal: '00001',
            tipo: tipoHacienda,
            consecutivo: consecutivo
        });

        // 3. XML Construction (v4.4 Spec)
        let xmlUnsigned = "";
        if (type === 'FE') xmlUnsigned = XmlFactory.buildFactura({ ...(docData as FacturaData), claveStr, consecutivoStr: consecutivoFull, fechaEmision: now });
        else if (type === 'REP') xmlUnsigned = XmlFactory.buildRep({ ...(docData as RepData), claveStr, consecutivoStr: consecutivoFull, fechaEmision: now });
        else if (type === 'FEC') xmlUnsigned = XmlFactory.buildFacturaCompra({ ...(docData as FacturaData), claveStr, consecutivoStr: consecutivoFull, fechaEmision: now });

        // 4. Digital Signature (XAdES-EPES)
        const xmlSigned = !isSimulator ? SignerService.signXml(xmlUnsigned, keyData!) : xmlUnsigned;

        // 5. Persistence: Create Draft (Atomic Step)
        // [FIX] Creamos el registro ANTES de enviar para evitar pérdida de datos si Hacienda cuelga

        const isRep = type === 'REP';
        const factura = !isRep ? (docData as FacturaData) : null;
        const rep = isRep ? (docData as RepData) : null;

        const invoice = await prisma.invoice.create({
            data: {
                orgId: orgId,
                tipoDocumento: type,
                clave: claveStr,
                consecutivo: consecutivoFull,
                fechaEmision: now,
                emisorNombre: docData.emisor.nombre,
                emisorCedula: docData.emisor.numeroIdentificacion,
                receptorNombre: docData.receptor?.nombre || 'N/A',
                receptorCedula: docData.receptor?.numeroIdentificacion || (type === 'FEC' ? 'EXTRANJERO' : 'N/A'),
                receptorCorreo: docData.receptor?.correo,
                moneda: factura?.resumen?.codigoMoneda || rep?.codigoMoneda || 'CRC',
                totalVenta: factura?.resumen?.totalVenta || rep?.montoPago || 0,
                totalImpuesto: factura?.resumen?.totalImpuesto || 0,
                totalComprobante: factura?.resumen?.totalComprobante || rep?.montoPago || 0,
                estado: 'PROCESANDO',
                xmlFirmado: xmlSigned,
                docData: docData as any, // Persistimos el detalle para el PDF
                referenciaClave: rep?.referencia?.numero || null,
                montoPago: rep?.montoPago || null
            }
        });

        // 6. Transmission (Hacienda API) - Using Centralized Service
        const { TransmissionService } = await import('@/lib/hacienda/transmission-service');

        let estadoHacienda = 'ENVIADO';
        let respuestaHacienda: any = null;

        try {
            respuestaHacienda = await TransmissionService.transmit({
                orgId,
                xmlSigned,
                clave: claveStr,
                emisorCedula: docData.emisor.numeroIdentificacion,
                receptorCedula: docData.receptor?.numeroIdentificacion
            });
        } catch (e: any) {
            console.error(`[SENTINEL] Fallo de envío: ${e.message}`);
            const isNetworkError = e.message.includes('fetch failed') || e.message.includes('API_ERROR: 5') || e.message.includes('timeout');

            if (isNetworkError) {
                const { ContingenciaService } = await import('@/lib/hacienda/contingencia');
                await ContingenciaService.encolar(xmlSigned, claveStr, e.message, orgId);
                estadoHacienda = 'EN_COLA';
            } else {
                // Actualizar a ERROR si fue algo no-recuperable antes de tirar el error
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { estado: 'ERROR', mensajeHacienda: e.message }
                });
                throw e;
            }
        }

        // 7. Final Update
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                estado: estadoHacienda,
                mensajeHacienda: respuestaHacienda ? JSON.stringify(respuestaHacienda) : null,
            }
        });

        // [LOG] Auditoría de emisión
        const { AuditService } = await import("@/lib/security/audit");
        await AuditService.log({
            orgId,
            action: 'INVOICE_CREATE',
            details: { clave: claveStr, type, estado: estadoHacienda }
        });

        VaultService.scrub(keyData);
        return {
            status: estadoHacienda === 'EN_COLA' ? 'warning' : 'success',
            message: estadoHacienda === 'EN_COLA' ? 'Encolado en contingencia.' : 'Documento emitido con éxito.',
            clave: claveStr,
            xmlSigned: xmlSigned,
            haciendaResponse: respuestaHacienda
        };

    } catch (error: unknown) {
        console.error('[CRITICAL] Flow breakdown:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error sistémico en el workflow.';
        return {
            status: 'error',
            message: errorMessage
        };
    }
}


// Stats & Helpers (Nova Hub) - DELEGATED TO DASHBOARD/ACTIONS

export async function checkInvoiceStatus(invoiceId: string, credentials: { user: string, pass: string }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).orgId) throw new Error("No autenticado");
        const orgId = (session.user as any).orgId;

        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                orgId: orgId
            }
        });

        if (!invoice) throw new Error('Documento no encontrado o no pertenece a su organización');

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { haciendaEnv: true }
        });

        const client = new HaciendaClient({
            username: credentials.user,
            password: credentials.pass,
            environment: (org?.haciendaEnv as any) || 'staging'
        });
        const tokenData = await client.getToken();
        const statusResponse = await client.getStatus(invoice.clave, tokenData.access_token);
        const nuevoEstado = (statusResponse['ind-estado'] || 'procesando').toUpperCase();
        await prisma.invoice.update({ where: { id: invoiceId }, data: { estado: nuevoEstado, mensajeHacienda: JSON.stringify(statusResponse) } });

        // [SWARM NOTIFICATION] Notify external consumer
        await WebhookService.notifyStatusChange(orgId, invoice.clave, nuevoEstado, statusResponse);

        return { success: true, status: nuevoEstado, response: statusResponse };
    } catch (e: any) {
        console.error("Status Check Error:", e);
        return { success: false, error: e.message };
    }
}

export async function syncContingencyQueue(credentials: { user: string, pass: string }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).orgId) throw new Error("No autenticado");
        const orgId = (session.user as any).orgId;

        const { ContingenciaService } = await import('@/lib/hacienda/contingencia');
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { haciendaEnv: true }
        });

        const client = new HaciendaClient({
            username: credentials.user,
            password: credentials.pass,
            environment: (org?.haciendaEnv as any) || 'staging'
        });

        await ContingenciaService.procesarCola(orgId, async (xml: string, clave: string) => {
            const tokenData = await client.getToken();

            // Intelligence: Try to find the emitter ID from the persisted invoice record
            const invoiceRecord = await prisma.invoice.findUnique({ where: { clave } });
            const emisor = invoiceRecord?.emisorCedula || "3101123456";
            const receptor = invoiceRecord?.receptorCedula;

            try {
                await client.sendInvoice(xml, tokenData.access_token, clave, emisor, receptor || undefined);
                return true;
            } catch (e) { return false; }
        });

        return { success: true };
    } catch (e: any) {
        console.error("Sync Error:", e);
        return { success: false, error: e.message };
    }
}


// Hacienda Health - DELEGATED TO DASHBOARD/ACTIONS/STATS

export async function register(data: any) {
    try {
        // 1. Zod Validation
        const validated = RegisterSchema.parse(data);
        const { email, password, name, orgName, cedula, plan } = validated;

        console.log(`[REGISTRATION_DEBUG] Starting registration for: ${email}`);

        // Validar si el usuario ya existe (insensible)
        const existingUser = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });
        if (existingUser) throw new Error("El correo ya está registrado.");

        // Validar si la organización ya existe
        const existingOrg = await prisma.organization.findUnique({ where: { cedula } });
        if (existingOrg) throw new Error("La cédula jurídica ya está registrada.");

        const hashedPassword = await bcrypt.hash(password, 12);

        // Crear Organización y Usuario en una transacción
        console.log(`[REGISTRATION_DEBUG] Creating organization and user...`);
        const result = await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: orgName,
                    cedula: cedula,
                    plan: plan || "STARTER"
                }
            });

            const user = await tx.user.create({
                data: {
                    email: email.toLowerCase(),
                    name,
                    password: hashedPassword,
                    orgId: org.id
                }
            });

            // [SECURITY] Audit Log Registration
            await AuditService.log({
                orgId: org.id,
                userId: user.id,
                action: 'AUTH_REGISTER',
                details: { plan: org.plan }
            });

            return { user, org };
        });

        console.log(`[REGISTRATION_DEBUG] Success: ${result.user.id}`);

        // [LOG] Auditoría de registro
        const { AuditService } = await import("@/lib/security/audit");
        await AuditService.log({
            orgId: result.org.id,
            userId: result.user.id,
            action: 'AUTH_REGISTER',
            details: { plan: result.org.plan, email: result.user.email }
        });

        return { success: true, userId: result.user.id, plan: result.org.plan };
    } catch (e: any) {
        console.error("Registration Error:", e);
        return { success: false, error: e.message };
    }
}
