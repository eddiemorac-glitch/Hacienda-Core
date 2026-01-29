import { NextResponse } from "next/server";

/**
 * [DEPRECATED - SECURITY FIX]
 * 
 * Este endpoint fue deshabilitado por razones de seguridad.
 * Exponer tokens de Hacienda permite bypass del sistema y uso no autorizado.
 * 
 * Los tokens ahora se manejan internamente por el executeDocumentWorkflow.
 */
export async function GET(req: Request) {
    return NextResponse.json({
        error: "ENDPOINT_DEPRECATED",
        message: "Este endpoint ha sido deshabilitado por razones de seguridad. Use /api/v1/documents para emitir documentos.",
        status: 410
    }, { status: 410 });
}
