import { prisma } from "@/lib/db";

/**
 * [SENTINEL WEBHOOK DISPATCHER]
 * Notifies the client's external URL about document status changes.
 */

export class WebhookService {
    static async notifyStatusChange(orgId: string, clave: string, status: string, haciendaResponse: any) {
        try {
            const org = await prisma.organization.findUnique({
                where: { id: orgId },
                select: { webhookUrl: true, webhookSecret: true, name: true }
            });

            if (!org?.webhookUrl) {
                console.log(`[WEBHOOK] No target URL for Org: ${org?.name || orgId}`);
                return;
            }

            console.log(`📡 [WEBHOOK] Dispatching notification to: ${org.webhookUrl}`);

            const payload = {
                event: 'document.status_changed',
                data: {
                    clave,
                    status,
                    hacienda_response: haciendaResponse,
                    timestamp: new Date().toISOString()
                }
            };

            const body = JSON.stringify(payload);
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'User-Agent': 'Nova-Sentinel-Webhook/1.0'
            };

            // [SECURITY FIX] Inyectar firma HMAC si hay un secreto configurado
            if (org.webhookSecret) {
                const crypto = await import('crypto');
                const signature = crypto
                    .createHmac('sha256', org.webhookSecret)
                    .update(body)
                    .digest('hex');
                headers['X-Sentinel-Signature'] = signature;
            }

            // Attempt notification with a timeout
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(org.webhookUrl, {
                method: 'POST',
                headers,
                body,
                signal: controller.signal
            });

            clearTimeout(id);

            if (response.ok) {
                console.log(`✅ [WEBHOOK] Notification delivered successfully for ${clave}.`);
            } else {
                console.error(`❌ [WEBHOOK] Delivery failed for ${clave}: ${response.status} ${response.statusText}`);
            }

        } catch (error: any) {
            console.error(`💥 [WEBHOOK] Critical failure during dispatch:`, error.message);
        }
    }
}
