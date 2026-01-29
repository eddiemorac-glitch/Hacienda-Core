
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: { equals: 'eddie.mora.c@gmail.com', mode: 'insensitive' } },
        include: { organization: true }
    });
    console.log('Full User Data:', JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
