import { NextResponse } from "next/server";
import { ApiKeyService } from "@/lib/api-key";
import { DocumentService } from "@/lib/hacienda/document-service";
import { headers } from "next/headers";
import { PLANS } from "@/lib/stripe-config";

/**
 * [PUBLIC API] - Document Generation v1
 * Allows third-party integration with Costa Rica v4.4 Spec.
 * Uses the organization's stored Hacienda credentials.
 */

export async function POST(req: Request) {
    try {
        const h = await headers();
        const apiKey = h.get("x-api-key");

        if (!apiKey) {
            return NextResponse.json({ error: "x-api-key header missing" }, { status: 401 });
        }

        // 1. Validate Key & Auth Organization
        const organization = await ApiKeyService.validateAndTrack(apiKey);

        // 2. Check if Org has Hacienda Credentials Configured
        if (!organization.haciendaUser || !organization.haciendaPass || !organization.haciendaP12 || !organization.haciendaPin) {
            return NextResponse.json({
                error: "La organización no tiene configuradas las credenciales de Hacienda en el Dashboard."
            }, { status: 400 });
        }

        // 3. API Access Verification (Sentinel Guard)
        const currentPlan: any = Object.values(PLANS).find((p: any) => p.id.toUpperCase() === (organization.plan || 'STARTER').toUpperCase());

        // [SECURITY] Verificar que la suscripción esté activa antes de permitir acceso a la API
        const isSubscriptionActive = organization.subscriptionStatus === 'active' || organization.subscriptionStatus === 'trialing';

        if (!currentPlan?.hasApiAccess) {
            return NextResponse.json({
                error: `[API_ACCESS_DENIED] Tu plan ${currentPlan?.name || 'Starter'} no incluye acceso a la API. Por favor mejora a Enterprise para habilitar la integración programática.`
            }, { status: 403 });
        }

        if (!isSubscriptionActive) {
            return NextResponse.json({
                error: `[SUBSCRIPTION_REQUIRED] Tu suscripción no está activa. Por favor verifica tu método de pago en el Dashboard para continuar usando la API.`
            }, { status: 402 }); // 402 Payment Required
        }

        // 3. Parse Document Data from Body
        const { docData, type } = await req.json();

        if (!docData || !type) {
            return NextResponse.json({ error: "Faltan datos requeridos (docData, type)" }, { status: 400 });
        }

        // 4. Trigger the Perfect v4.4 Engine
        const { decrypt } = await import("@/lib/security/crypto");

        const result = await DocumentService.executeWorkflow({
            orgId: organization.id,
            docData,
            type: type as 'FE' | 'REP' | 'FEC',
            security: {
                p12Buffer: Buffer.from(organization.haciendaP12, 'base64'),
                pin: decrypt(organization.haciendaPin),
                haciendaUser: organization.haciendaUser,
                haciendaPass: decrypt(organization.haciendaPass)
            }
        });

        if (result.status === 'error') {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("[API ERROR]", error);
        return NextResponse.json({
            error: error.message || "Internal API Error"
        }, { status: error.message?.includes("Límite") ? 429 : 500 });
    }
}
