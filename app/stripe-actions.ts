
'use server';

import { stripe, validateStripeConfig } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * [NOVA PROTOCOL] - Stripe Checkout Engine
 * Manages the transition from Trial/Starter to Paid plans.
 */
export async function createCheckoutSession(priceId: string) {
    validateStripeConfig();
    const session = await getServerSession(getAuthOptions());

    if (!session || !session.user || !(session.user as any).orgId) {
        throw new Error("Debe estar autenticado para realizar esta acción.");
    }

    const orgId = (session.user as any).orgId;
    const userEmail = session.user.email;

    const organization = await prisma.organization.findUnique({
        where: { id: orgId }
    });

    if (!organization) throw new Error("Organización no encontrada.");

    let customerId = organization.stripeCustomerId;

    // Ensure Stripe customer exists
    if (!customerId) {
        try {
            // [ROBUSTNESS] Validar formato de email básico antes de enviar a Stripe
            const isValidEmail = userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail);

            const customer = await stripe.customers.create({
                email: isValidEmail ? (userEmail as string) : undefined, // No enviamos si es inválido
                name: organization.name,
                metadata: {
                    orgId: orgId
                }
            });
            customerId = customer.id;
            await prisma.organization.update({
                where: { id: orgId },
                data: { stripeCustomerId: customerId }
            });
        } catch (err: any) {
            console.error("[STRIPE_CUSTOMER_ERROR]", err);
            // Si falla la creación con email, intentamos una vez más sin nada para no bloquear
            const fallbackCustomer = await stripe.customers.create({
                name: organization.name,
                metadata: { orgId: orgId }
            });
            customerId = fallbackCustomer.id;
            await prisma.organization.update({
                where: { id: orgId },
                data: { stripeCustomerId: customerId }
            });
        }
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    try {
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/dashboard?payment=canceled`,
            automatic_tax: { enabled: true },
            tax_id_collection: { enabled: true },
            customer_update: {
                name: 'auto',
                address: 'auto',
            },
            metadata: {
                orgId: orgId,
                priceId: priceId
            },
            subscription_data: {
                metadata: {
                    orgId: orgId
                }
            }
        });

        if (!checkoutSession.url) throw new Error("Error al crear sesión de pago");
        return { url: checkoutSession.url };

    } catch (err: any) {
        console.error("[STRIPE_ERROR]", err);

        // [RESILIENCE] Detectar si falla por falta de dirección de oficina central (Stripe Tax requirement)
        if (err.message?.includes('head office address') || err.message?.includes('automatic tax')) {
            console.warn("[STRIPE] Fallo Stripe Tax por falta de dirección. Reintentando sin impuestos...");
            try {
                const sessionNoTax = await stripe.checkout.sessions.create({
                    customer: customerId,
                    line_items: [{ price: priceId, quantity: 1 }],
                    mode: 'subscription',
                    success_url: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${baseUrl}/dashboard?payment=canceled`,
                    metadata: { orgId: orgId, priceId: priceId }
                });
                if (sessionNoTax.url) return { url: sessionNoTax.url };
            } catch (innerErr) {
                console.error("[STRIPE_FATAL]", innerErr);
            }
        }

        // [ROBUSTNESS] If email is invalid (common in proxy/test envs), try creating WITHOUT linking email
        if (err.code === 'email_invalid' || err.message?.includes('email')) {
            console.warn("[STRIPE] Retrying WITHOUT email due to invalid email error...");
            const fallbackSession = await stripe.checkout.sessions.create({
                line_items: [{ price: priceId, quantity: 1 }],
                mode: 'subscription',
                success_url: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${baseUrl}/dashboard?payment=canceled`,
                automatic_tax: { enabled: true },
                metadata: { orgId: orgId, priceId: priceId }
            }).catch(() => stripe.checkout.sessions.create({ // Triple fallback: no email AND no tax
                line_items: [{ price: priceId, quantity: 1 }],
                mode: 'subscription',
                success_url: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${baseUrl}/dashboard?payment=canceled`,
                metadata: { orgId: orgId, priceId: priceId }
            }));

            if (fallbackSession.url) return { url: fallbackSession.url };
        }

        throw err;
    }
}

export async function createPortalSession() {
    validateStripeConfig();
    const session = await getServerSession(getAuthOptions());
    if (!session || !session.user || !(session.user as any).orgId) {
        throw new Error("No autenticado");
    }

    const orgId = (session.user as any).orgId;
    const organization = await prisma.organization.findUnique({
        where: { id: orgId }
    });

    if (!organization || !organization.stripeCustomerId) {
        // [SWARM INTELLIGENCE] If no customer yet, we can't open portal.
        // Returning a specific error flag.
        return { error: 'NO_CUSTOMER', url: '/dashboard/billing' };
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: organization.stripeCustomerId,
        return_url: `${baseUrl}/dashboard`,
    });

    return { url: portalSession.url };
}
