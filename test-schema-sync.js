
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const org = await prisma.organization.create({
            data: {
                name: "Sync Test Org",
                cedula: "999999999",
                logoUrl: "http://test.com/logo.png" // Testing the new column
            }
        });
        console.log('Organization created successfully with logoUrl:', org.id);
        await prisma.organization.delete({ where: { id: org.id } });
        console.log('Cleanup successful.');
    } catch (error) {
        console.error('Error testing schema:', error);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
