import { NextResponse } from 'next/server';
import { EventBus } from '@/lib/hacienda/event-bus';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sinceId = parseInt(searchParams.get('sinceId') || '0');

    const events = EventBus.getEvents(sinceId);
    return NextResponse.json(events);
}
