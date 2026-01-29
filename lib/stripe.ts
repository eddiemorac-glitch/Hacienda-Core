import Stripe from 'stripe';
import { PLANS } from './stripe-config';

export { PLANS };

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Solo inicializar si existe la llave, si no, crear un objeto dummy para evitar errores de tipado
export const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, {
        apiVersion: '2025-01-27.acacia' as any,
        typescript: true,
    })
    : (null as any);

// Helper to check if stripe is properly configured on server
export function validateStripeConfig() {
    if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY is missing from environment variables');
    }
}
