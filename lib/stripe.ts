import Stripe from 'stripe';
import { PLANS } from './stripe-config';

export { PLANS };

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(stripeSecretKey || '', {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
});

// Helper to check if stripe is properly configured on server
export function validateStripeConfig() {
    if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY is missing from environment variables');
    }
}
