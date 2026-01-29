import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteToAdmin() {
    const email = 'eddie.mora.c@gmail.com';

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.error(`❌ Error: No se encontró ningún usuario con el correo ${email}. ¿Te registraste con ese correo exacto?`);
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });

        console.log(`✅ ¡ÉXITO! El usuario ${email} ahora tiene el rol: ${updatedUser.role}`);
    } catch (error) {
        console.error('❌ Error al actualizar el rol:', error);
    } finally {
        await prisma.$disconnect();
    }
}

promoteToAdmin();
