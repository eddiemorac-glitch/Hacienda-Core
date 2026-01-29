import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env parser
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = value;
            }
        });
    }
}

loadEnv();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-01-27.acacia' as any,
});

async function main() {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ STRIPE_SECRET_KEY no encontrada en .env');
        return;
    }

    console.log('🚀 Iniciando creación de productos en Stripe (CRC)...');

    try {
        // 1. Starter Node
        const starterProduct = await stripe.products.create({
            name: 'Starter Node (v4.4 Compliance)',
            description: 'Facturación electrónica v4.4 para profesionales y pequeñas empresas.',
            metadata: { planId: 'starter' }
        });

        const starterPrice = await stripe.prices.create({
            product: starterProduct.id,
            unit_amount: 2500000,
            currency: 'crc',
            recurring: { interval: 'month' },
        });

        console.log(`✅ Starter Node Creado: ${starterPrice.id}`);

        // 2. Business Swarm
        const businessProduct = await stripe.products.create({
            name: 'Business Swarm (Automation & REP)',
            description: 'Documentos ilimitados, REP y automatización avanzada.',
            metadata: { planId: 'business' }
        });

        const businessPrice = await stripe.prices.create({
            product: businessProduct.id,
            unit_amount: 5500000,
            currency: 'crc',
            recurring: { interval: 'month' },
        });

        console.log(`✅ Business Swarm Creado: ${businessPrice.id}`);

        // 3. Enterprise Ultra
        const enterpriseProduct = await stripe.products.create({
            name: 'Enterprise Ultra (Custom Swarm)',
            description: 'Acceso total vía API e integración personalizada.',
            metadata: { planId: 'enterprise' }
        });

        const enterprisePrice = await stripe.prices.create({
            product: enterpriseProduct.id,
            unit_amount: 9500000,
            currency: 'crc',
            recurring: { interval: 'month' },
        });

        console.log(`✅ Enterprise Ultra Creado: ${enterprisePrice.id}`);

        console.log('\n--- IDS PARA TU .ENV ---');
        console.log(`STRIPE_PRICE_STARTER="${starterPrice.id}"`);
        console.log(`STRIPE_PRICE_BUSINESS="${businessPrice.id}"`);
        console.log(`STRIPE_PRICE_ENTERPRISE="${enterprisePrice.id}"`);
        console.log(`NEXT_PUBLIC_STRIPE_PRICE_STARTER="${starterPrice.id}"`);
        console.log(`NEXT_PUBLIC_STRIPE_PRICE_BUSINESS="${businessPrice.id}"`);
        console.log(`NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE="${enterprisePrice.id}"`);

    } catch (error: any) {
        console.error('❌ Error creando productos:', error.message);
    }
}

main();
