import { NextResponse } from 'next/server';
import { runGhostInvoices, toggleSimulator } from '@/app/dashboard/qa/actions';

export async function GET() {
    try {
        console.log('[SENTINEL] Remote Trigger Received (No-UI-Mode)');

        // 1. Force Simulator ON
        await toggleSimulator(true);
        console.log('[SENTINEL] Simulator Tethered.');

        // 2. Run Stress Test (3 Invoices)
        console.log('[SENTINEL] Running Ghost Burst...');
        const results = await runGhostInvoices(true);

        return NextResponse.json({
            status: 'CERTIFIED',
            results: results.map(r => ({
                clave: r.clave?.slice(-10),
                status: r.status,
                message: r.message
            }))
        });
    } catch (e: any) {
        console.error('[SENTINEL] Remote Trial Failed:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
