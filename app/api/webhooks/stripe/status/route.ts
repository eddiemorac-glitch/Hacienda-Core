import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PLANS } from "@/lib/stripe-config";

/**
 * [SENTINEL WEBHOOK] - Stripe Status Listener
 * Keeps the local database in sync with global financial events.
 */

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    // Si no está configurado Stripe, responder con 200 para no romper el build
    if (!process.env.STRIPE_SECRET_KEY) {
        console.warn("⚠️ Stripe secret key missing. Skipping webhook processing.");
        return NextResponse.json({ received: true });
    }

    const body = await req.text();
    const h = await headers();
    const sig = h.get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
        if (!endpointSecret) {
            console.error("❌ STRIPE_WEBHOOK_SECRET is not set.");
            return NextResponse.json({ error: "Webhook configuration error" }, { status: 500 });
        }
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    try {
        switch (event.type) {
            case "checkout.session.completed": {
                let session = event.data.object as Stripe.Checkout.Session;
                const orgId = session.metadata?.orgId;

                console.log(`💰 Checkout session completed: ${session.id} for Org: ${orgId}`);

                if (!session.line_items) {
                    session = await stripe.checkout.sessions.retrieve(session.id, {
                        expand: ['line_items']
                    });
                }

                if (orgId) {
                    const priceId = session.line_items?.data[0]?.price?.id || session.metadata?.priceId;
                    let planName = "STARTER";
                    if (priceId === PLANS.BUSINESS.priceId) planName = "BUSINESS";
                    else if (priceId === PLANS.ENTERPRISE.priceId) planName = "ENTERPRISE";

                    await prisma.organization.update({
                        where: { id: orgId },
                        data: {
                            stripeSubscriptionId: session.subscription as string,
                            subscriptionStatus: "active",
                            plan: planName,
                            stripePriceId: priceId
                        }
                    });
                    console.log(`✅ Organization ${orgId} upgraded to ${planName}`);
                }
                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                let orgId: string | undefined = subscription.metadata?.orgId;

                // [FALLBACK] Si no hay orgId en metadata, buscar por stripeCustomerId
                if (!orgId) {
                    const customerId = subscription.customer as string;
                    const org = await prisma.organization.findFirst({
                        where: { stripeCustomerId: customerId }
                    });
                    orgId = org?.id;
                    console.log(`🔎 Fallback: Found Org ${orgId} via stripeCustomerId ${customerId}`);
                }

                if (orgId) {
                    console.log(`🔄 Subscription ${subscription.id} [${event.type}] for Org: ${orgId}. Status: ${subscription.status}`);

                    const priceId = subscription.items.data[0]?.price?.id;
                    let planName = "STARTER";
                    if (priceId === PLANS.BUSINESS.priceId) planName = "BUSINESS";
                    else if (priceId === PLANS.ENTERPRISE.priceId) planName = "ENTERPRISE";

                    // Si la suscripción fue cancelada, degradar a STARTER
                    if (event.type === "customer.subscription.deleted") {
                        planName = "STARTER";
                    }

                    await prisma.organization.update({
                        where: { id: orgId as string },
                        data: {
                            subscriptionStatus: subscription.status,
                            stripePriceId: priceId || null,
                            plan: planName,
                            subscriptionEndsAt: (subscription as any).current_period_end
                                ? new Date((subscription as any).current_period_end * 1000)
                                : null,
                        }
                    });

                    // [AUDIT] Registrar el cambio
                    const { AuditService } = await import("@/lib/security/audit");
                    await AuditService.log({
                        orgId,
                        action: 'SUBSCRIPTION_CHANGE',
                        details: {
                            eventType: event.type,
                            status: subscription.status,
                            plan: planName
                        }
                    });
                } else {
                    console.warn(`⚠️ Could not find organization for subscription ${subscription.id}`);
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription as string;

                // Buscar la organización por el subscription ID de Stripe
                const organization = await prisma.organization.findFirst({
                    where: { stripeSubscriptionId: subscriptionId }
                });

                if (organization) {
                    console.warn(`⚠️ Payment FAILED for Org: ${organization.id}. Blocking access.`);
                    await prisma.organization.update({
                        where: { id: organization.id },
                        data: { subscriptionStatus: "past_due" }
                    });
                }
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                console.log(`✅ Payment received for invoice: ${invoice.id}`);
                break;
            }

            default:
                console.log(`ℹ️ Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error("❌ Webhook processing failed:", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
