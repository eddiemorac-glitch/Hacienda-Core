
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const count = await prisma.cabys.count();
        console.log(`\n📊 FINAL CABYS COUNT: ${count}`);
    } catch (e) {
        console.error("Error connecting to DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
