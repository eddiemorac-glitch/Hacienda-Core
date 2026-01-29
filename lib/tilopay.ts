/**
 * [TILOPAY INTEGRATION SERVICE]
 * Payment processing for Costa Rica using Tilopay API
 * 
 * Documentation: https://documenter.getpostman.com/view/12758640/TVKA5KUT
 */

const TILOPAY_API_URL = process.env.TILOPAY_API_URL || 'https://app.tilopay.com/api/v1';

export interface TilopayConfig {
    apiKey: string;
    apiUser: string;
    apiSecret: string;
}

export interface TilopayCheckoutParams {
    amount: number;
    currency: 'CRC' | 'USD';
    orderId: string;
    description: string;
    customerEmail: string;
    customerName?: string;
    redirectUrl: string;
    callbackUrl: string;
    subscription?: {
        planId: string;
        intervalDays: number;
    };
}

export interface TilopayResponse {
    success: boolean;
    checkoutUrl?: string;
    transactionId?: string;
    error?: string;
}

export interface TilopayWebhookPayload {
    transactionId: string;
    orderId: string;
    status: 'approved' | 'pending' | 'declined' | 'cancelled';
    amount: number;
    currency: string;
    paymentMethod: string;
    timestamp: string;
    subscription?: {
        id: string;
        status: 'active' | 'cancelled' | 'paused';
    };
}

export class TilopayService {
    private config: TilopayConfig;

    constructor() {
        this.config = {
            apiKey: process.env.TILOPAY_API_KEY || '',
            apiUser: process.env.TILOPAY_API_USER || '',
            apiSecret: process.env.TILOPAY_API_SECRET || ''
        };
    }

    /**
     * Generates authorization header for Tilopay API
     */
    private getAuthHeader(): string {
        // Tilopay uses Basic Auth with user:secret
        const credentials = Buffer.from(
            `${this.config.apiUser}:${this.config.apiSecret}`
        ).toString('base64');
        return `Basic ${credentials}`;
    }

    /**
     * Creates a checkout session for one-time or subscription payment
     */
    async createCheckout(params: TilopayCheckoutParams): Promise<TilopayResponse> {
        try {
            const payload: any = {
                apiKey: this.config.apiKey,
                amount: params.amount.toFixed(2),
                currency: params.currency,
                orderNumber: params.orderId,
                description: params.description,
                email: params.customerEmail,
                redirect: params.redirectUrl,
                callback: params.callbackUrl,
                platform: 'api'
            };

            // Add subscription parameters if provided
            if (params.subscription) {
                payload.recurring = 1;
                payload.recurringInterval = params.subscription.intervalDays;
                payload.planId = params.subscription.planId;
            }

            const response = await fetch(`${TILOPAY_API_URL}/createPayment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getAuthHeader()
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success || data.url) {
                return {
                    success: true,
                    checkoutUrl: data.url || data.checkoutUrl,
                    transactionId: data.transactionId
                };
            }

            return {
                success: false,
                error: data.message || 'Error procesando pago con Tilopay'
            };

        } catch (error: any) {
            console.error('[TILOPAY] Checkout creation failed:', error);
            return {
                success: false,
                error: error.message || 'Error de conexión con Tilopay'
            };
        }
    }

    /**
     * Verifies a transaction status
     */
    async verifyTransaction(transactionId: string): Promise<TilopayResponse & { status?: string }> {
        try {
            const response = await fetch(`${TILOPAY_API_URL}/getTransaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getAuthHeader()
                },
                body: JSON.stringify({
                    apiKey: this.config.apiKey,
                    transactionId
                })
            });

            const data = await response.json();

            return {
                success: true,
                transactionId: data.transactionId,
                status: data.status
            };

        } catch (error: any) {
            console.error('[TILOPAY] Transaction verification failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cancels a subscription
     */
    async cancelSubscription(subscriptionId: string): Promise<TilopayResponse> {
        try {
            const response = await fetch(`${TILOPAY_API_URL}/cancelSubscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getAuthHeader()
                },
                body: JSON.stringify({
                    apiKey: this.config.apiKey,
                    subscriptionId
                })
            });

            const data = await response.json();

            return {
                success: data.success || data.status === 'cancelled'
            };

        } catch (error: any) {
            console.error('[TILOPAY] Subscription cancellation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validates webhook signature (if Tilopay provides one)
     */
    validateWebhookSignature(payload: string, signature: string): boolean {
        // Tilopay may provide HMAC signature validation
        // Implementation depends on their specific webhook security
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', this.config.apiSecret)
            .update(payload)
            .digest('hex');

        return signature === expectedSignature;
    }
}

// Singleton instance
export const tilopay = new TilopayService();
