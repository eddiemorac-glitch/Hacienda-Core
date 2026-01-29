import { NextResponse } from "next/server";
import { ApiKeyService } from "@/lib/api-key";
import { HaciendaClient } from "@/lib/hacienda/api-client";
import { headers } from "next/headers";

/**
 * [PUBLIC API] - GET /api/v1/factura/estado/[clave]
 * Mapped from Engineer's request.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ clave: string }> } // [NEXT16-FIX] Params are now Promises
) {
    const { clave } = await params; // [NEXT16-FIX] Await params

    try {
        const h = await headers();
        const apiKey = h.get("x-api-key");
        if (!apiKey) return NextResponse.json({ error: "x-api-key header missing" }, { status: 401 });

        const organization = await ApiKeyService.validateAndTrack(apiKey);

        const client = new HaciendaClient({
            username: organization.haciendaUser!,
            password: organization.haciendaPass!,
            environment: (process.env.HACIENDA_ENV as any) || 'staging'
        });

        const tokenData = await client.getToken();
        const result = await client.getStatus(clave, tokenData.access_token);

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
