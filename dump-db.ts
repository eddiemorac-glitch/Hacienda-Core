import { prisma } from './lib/db';

async function dump() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                password: true // To check if it's hashed
            }
        });
        console.log("--- USER DUMP ---");
        console.log(JSON.stringify(users, null, 2));

        const orgs = await prisma.organization.findMany();
        console.log("--- ORG DUMP ---");
        console.log(JSON.stringify(orgs, null, 2));
    } catch (e: any) {
        console.error("DUMP FAILED:", e.message);
    } finally {
        process.exit(0);
    }
}

dump();
