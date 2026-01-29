
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: { equals: 'eddie.mora.c@gmail.com', mode: 'insensitive' } }
    });
    console.log('User found:', user ? { id: user.id, email: user.email, hasPassword: !!user.password, role: user.role } : 'Not found');
    if (user) {
        // Check if password starts with bcrypt signature $2b$ or $2a$
        const isBcrypt = user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'));
        console.log('Is Bcrypt?', isBcrypt);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
