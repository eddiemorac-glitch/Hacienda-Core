
import { prisma } from '@/lib/db';
import { VaultService } from '@/lib/security/vault';
import { SignerService } from '@/lib/security/signer';
import { XmlFactory } from '@/lib/hacienda/xml-factory';
import { ClaveHacienda, SituacionComprobante, TipoDocumento } from '@/lib/hacienda/clave';
import { FacturaData, RepData } from '@/lib/types/factura';
import { PLANS } from '@/lib/stripe-config';
import { TransmissionService } from './transmission-service';
import { ContingenciaService } from './contingencia';

/**
 * [HACIENDA CORE SERVICE]
 * Stateless logic for document processing, decoupled from server actions.
 */

export interface DocumentState {
    status: 'idle' | 'processing' | 'success' | 'warning' | 'error';
    message: string;
    clave?: string;
    xmlSigned?: string;
    haciendaResponse?: any;
}

const recentInvoices = new Set<string>();

export class DocumentService {
    static async executeWorkflow({
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

            // [ANTI-ACCIDENTAL DUPLICATION]
            const submissionKey = `${orgId}-${totalComprobante}-${docData.receptor?.numeroIdentificacion}`;
            if (recentInvoices.has(submissionKey)) {
                throw new Error("Ya se está procesando un documento idéntico. Por favor espere 10 segundos.");
            }
            recentInvoices.add(submissionKey);
            setTimeout(() => recentInvoices.delete(submissionKey), 10000);

            const isSimulator = process.env.HACIENDA_ENV === 'simulator';

            // 1. Quota & Feature Verification
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const currentOrg = await prisma.organization.findUnique({
                where: { id: orgId },
                select: { plan: true, subscriptionStatus: true }
            });

            const rawPlan = (currentOrg?.plan || 'STARTER').toUpperCase();
            const currentPlan = Object.values(PLANS).find((p) => p.id.toUpperCase() === rawPlan);

            if (!currentPlan) throw new Error(`Plan no encontrado.`);

            // [FEATURE CHECK]
            if (!currentPlan.allowedTypes.includes(type)) {
                throw new Error(`Tu plan ${currentPlan.name} no permite emitir documentos de tipo: ${type}.`);
            }

            // 2. Vault Unlock
            let p12Buffer: Buffer;
            if (isSimulator) {
                p12Buffer = Buffer.from("");
            } else if (security.p12Buffer) {
                p12Buffer = security.p12Buffer;
            } else if (security.p12File) {
                p12Buffer = Buffer.from(await security.p12File.arrayBuffer());
            } else {
                throw new Error('Certificado P12 no proporcionado.');
            }

            const keyData = !isSimulator ? VaultService.unlock({ p12Buffer, pin: security.pin }) : null;

            // 3. Identity & Sequence Management
            const now = new Date();
            const { getNextSequence, formatSequence } = await import('@/lib/hacienda/sequence-service');
            const sequenceNumber = await getNextSequence({ orgId, tipoDoc: type });
            const consecutivo = formatSequence(sequenceNumber);

            const tipoHacienda = type === 'FEC' ? TipoDocumento.FacturaElectronicaCompra :
                (type === 'REP' ? TipoDocumento.ReciboElectronicoPago : TipoDocumento.FacturaElectronica);

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

            // 4. XML Construction
            let xmlUnsigned = "";
            if (type === 'FE') xmlUnsigned = XmlFactory.buildFactura({ ...(docData as FacturaData), claveStr, consecutivoStr: consecutivoFull, fechaEmision: now });
            else if (type === 'REP') xmlUnsigned = XmlFactory.buildRep({ ...(docData as RepData), claveStr, consecutivoStr: consecutivoFull, fechaEmision: now });
            else if (type === 'FEC') xmlUnsigned = XmlFactory.buildFacturaCompra({ ...(docData as FacturaData), claveStr, consecutivoStr: consecutivoFull, fechaEmision: now });

            // 5. Digital Signature
            const xmlSigned = !isSimulator ? SignerService.signXml(xmlUnsigned, keyData!) : xmlUnsigned;

            // 6. Persistence: Create Draft
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
                    moneda: factura?.resumen?.codigoMoneda || rep?.codigoMoneda || 'CRC',
                    totalVenta: factura?.resumen?.totalVenta || rep?.montoPago || 0,
                    totalImpuesto: factura?.resumen?.totalImpuesto || 0,
                    totalComprobante: factura?.resumen?.totalComprobante || rep?.montoPago || 0,
                    estado: 'PROCESANDO',
                    xmlFirmado: xmlSigned,
                    docData: docData as any
                }
            });

            // 7. Transmission
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
                    await ContingenciaService.encolar(xmlSigned, claveStr, e.message, orgId);
                    estadoHacienda = 'EN_COLA';
                } else {
                    await prisma.invoice.update({
                        where: { id: invoice.id },
                        data: { estado: 'ERROR', mensajeHacienda: e.message }
                    });
                    throw e;
                }
            }

            // 8. Final Update
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    estado: estadoHacienda,
                    mensajeHacienda: respuestaHacienda ? JSON.stringify(respuestaHacienda) : null,
                }
            });

            // 9. Audit (Dynamic Import to avoid cycle)
            try {
                const { AuditService } = await import("@/lib/security/audit");
                await AuditService.log({
                    orgId,
                    action: 'INVOICE_CREATE',
                    details: { clave: claveStr, type, estado: estadoHacienda }
                });
            } catch (auditError) {
                console.warn("Audit log failed:", auditError);
            }

            if (!isSimulator) VaultService.scrub(keyData);

            return {
                status: estadoHacienda === 'EN_COLA' ? 'warning' : 'success',
                message: estadoHacienda === 'EN_COLA' ? 'Encolado en contingencia.' : 'Documento emitido con éxito.',
                clave: claveStr,
                xmlSigned: xmlSigned,
                haciendaResponse: respuestaHacienda
            };

        } catch (error: any) {
            console.error('[CRITICAL] Document Service Error:', error);
            return {
                status: 'error',
                message: error.message || 'Error sistémico en el procesamiento.'
            };
        }
    }
}
