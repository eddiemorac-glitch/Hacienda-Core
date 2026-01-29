import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('\n[SENTINEL DEBUG REPORT]');
        console.log('TIMESTAMP:', new Date().toISOString());
        console.log('LEVEL:', body.level || 'INFO');
        console.log('MESSAGE:', body.message);
        console.log('DATA:', JSON.stringify(body.data, null, 2));
        console.log('------------------------\n');

        return NextResponse.json({ received: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
    }
}
