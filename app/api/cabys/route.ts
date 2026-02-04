
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
        return NextResponse.json([]);
    }

    try {
        // [PERFORMANCE] Limit results to 20 to avoid heavy payloads
        const results = await prisma.cabys.findMany({
            where: {
                OR: [
                    { descripcion: { contains: query, mode: 'insensitive' } },
                    { codigo: { startsWith: query } }
                ]
            },
            take: 20
        });

        // Map Decimal to number for frontend compatibility if needed, 
        // though JSON.stringify handles it (as string usually).
        // Let's ensure it matches the interface.
        const mapped = results.map(item => ({
            codigo: item.codigo,
            descripcion: item.descripcion,
            impuesto: Number(item.impuesto)
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error("CABYS Search Error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
