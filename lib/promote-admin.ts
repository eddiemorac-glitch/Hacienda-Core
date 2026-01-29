import { PrismaClient } from '@prisma/client';

/**
 * [SENTINEL ADMIN ELEVATOR]
 * Simple script to promote a user to ADMIN.
 */

const prisma = new PrismaClient();

async function promote(email: string) {
    console.log(`🚀 Elevando privilegios para: ${email}...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        console.log(`✅ EXITO: ${user.name} ahora es ADMINISTRADOR.`);
    } catch (e: any) {
        console.error(`❌ ERROR: No se encontró al usuario o el esquema no está actualizado.`, e.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Pass the email as argument or hardcode your main email here
const targetEmail = process.argv[2] || 'edmoq@example.com';
promote(targetEmail);
