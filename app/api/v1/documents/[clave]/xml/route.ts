import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * [SENTINEL - DOCUMENT API]
 * Exportación de XML firmado para cumplimiento legal.
 */

export async function GET(
    request: Request,
    { params }: { params: Promise<{ clave: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).orgId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { clave } = await params;
    const orgId = (session.user as any).orgId;

    const invoice = await prisma.invoice.findUnique({
        where: { clave, orgId }
    });

    if (!invoice) {
        return new NextResponse("Invoice not found", { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/xml');
    headers.set('Content-Disposition', `attachment; filename="FACTURA-${clave}.xml"`);

    return new NextResponse(invoice.xmlFirmado, {
        status: 200,
        headers,
    });
}
