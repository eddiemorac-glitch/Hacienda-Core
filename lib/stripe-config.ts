export const PLANS = {
    STARTER: {
        id: 'starter',
        name: 'Starter Node (v4.4 Compliance)',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
        price: 25000,
        quota: 50,
        allowedTypes: ['FE'],
        hasApiAccess: false,
    },
    BUSINESS: {
        id: 'business',
        name: 'Business Swarm (Automation & REP)',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS || '',
        price: 55000,
        quota: Infinity,
        allowedTypes: ['FE', 'REP', 'FEC'],
        hasApiAccess: false,
    },
    ENTERPRISE: {
        id: 'enterprise',
        name: 'Enterprise Ultra (Custom Swarm)',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || '',
        price: 95000,
        quota: Infinity,
        allowedTypes: ['FE', 'REP', 'FEC'],
        hasApiAccess: true,
    },
};
