import fs from 'fs';
import path from 'path';

/**
 * [SENTINEL - EVENT BUS]
 * Shared event bus for inter-process communication within the swarm.
 */
export class EventBus {
    private static BUS_DIR = path.join(process.cwd(), '.agent_hub');
    private static BUS_FILE = path.join(EventBus.BUS_DIR, 'event_bus.json');

    private static init() {
        if (!fs.existsSync(EventBus.BUS_DIR)) {
            fs.mkdirSync(EventBus.BUS_DIR, { recursive: true });
        }
        if (!fs.existsSync(EventBus.BUS_FILE)) {
            fs.writeFileSync(EventBus.BUS_FILE, JSON.stringify({ events: [] }));
        }
    }

    static emit(source: string, type: string, payload: any) {
        EventBus.init();
        try {
            const data = JSON.parse(fs.readFileSync(EventBus.BUS_FILE, 'utf-8'));
            const event = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                source,
                type,
                payload
            };
            data.events.push(event);
            // Limit to last 50 events
            data.events = data.events.slice(-50);
            fs.writeFileSync(EventBus.BUS_FILE, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error("EventBus Error:", e);
        }
    }

    static getEvents(sinceId = 0) {
        EventBus.init();
        try {
            const data = JSON.parse(fs.readFileSync(EventBus.BUS_FILE, 'utf-8'));
            return data.events.filter((e: any) => e.id > sinceId);
        } catch (e) {
            return [];
        }
    }
}
