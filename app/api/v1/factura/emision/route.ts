import { NextResponse } from "next/server";
import { ApiKeyService } from "@/lib/api-key";
import { DocumentService } from "@/lib/hacienda/document-service";
import { headers } from "next/headers";
import { decrypt } from "@/lib/security/crypto";

/**
 * [PUBLIC API] - POST /api/v1/factura/emision
 * Mapped from Engineer's request.
 */
export async function POST(req: Request) {
    try {
        const h = await headers();
        const apiKey = h.get("x-api-key");
        if (!apiKey) return NextResponse.json({ error: "x-api-key header missing" }, { status: 401 });

        const organization = await ApiKeyService.validateAndTrack(apiKey);
        if (!organization.haciendaUser || !organization.haciendaP12) {
            return NextResponse.json({ error: "Hacienda credentials not configured" }, { status: 400 });
        }

        const { docData, type } = await req.json();

        const result = await DocumentService.executeWorkflow({
            orgId: organization.id,
            docData,
            type: type || 'FE',
            security: {
                p12Buffer: Buffer.from(organization.haciendaP12, 'base64'),
                pin: decrypt(organization.haciendaPin!),
                haciendaUser: organization.haciendaUser!,
                haciendaPass: decrypt(organization.haciendaPass!)
            }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
