'use server';

import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

/**
 * [SENTINEL - AUTH ENGINE]
 * Funciones de utilidad para la gestión de identidad y seguridad.
 */

export async function requestPasswordReset(email: string) {
    console.log(`[AUTH] Solicitud de reinicio para: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        // Por seguridad, no revelamos si el usuario existe, pero retornamos éxito simulado
        return { success: true, message: "Si el correo es válido, recibirá un enlace en breve." };
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000); // 1 hora de validez

    // Guardar token en DB
    await prisma.passwordResetToken.upsert({
        where: { email_token: { email, token } }, // This might fail if email/token unique constraint isn't perfect for upsert, using simple create for now
        update: { token, expires },
        create: { email, token, expires }
    }).catch(async () => {
        // Fallback simple si el upsert falla por lógica de campos únicos
        await prisma.passwordResetToken.create({ data: { email, token, expires } });
    });

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;

    // LOGGEAMOS EL LINK EN LUGAR DE ENVIAR EMAIL (DEMO MODE)
    // En producción aquí se integra SendGrid, AWS SES o Resend.
    console.log(`\n--- [EMAIL SIMULATION] ---`);
    console.log(`Para: ${email}`);
    console.log(`Link: ${resetLink}`);
    console.log(`--- [END SIMULATION] ---\n`);

    return { success: true, message: "Si el correo es válido, recibirá un enlace en breve." };
}

export async function resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token }
    });

    if (!resetToken || resetToken.expires < new Date()) {
        return { success: false, message: "El enlace ha expirado o no es válido." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword }
    });

    // Eliminar el token usado
    await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
    });

    return { success: true, message: "Contraseña actualizada exitosamente. Ya puede iniciar sesión." };
}
