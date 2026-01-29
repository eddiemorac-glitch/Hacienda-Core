
'use server';

import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from 'zod';

const RegisterSchema = z.object({
    email: z.string().email("Correo electrónico inválido"),
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
        .regex(/[a-z]/, "Debe contener al menos una minúscula")
        .regex(/[0-9]/, "Debe contener al menos un número")
        .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    orgName: z.string().min(3, "El nombre de la organización debe tener al menos 3 caracteres"),
    cedula: z.string().regex(/^\d{9,12}$/, "La cédula debe ser numérica (9-12 dígitos)"),
    plan: z.string().optional()
});

export async function register(data: any) {
    try {
        const validated = RegisterSchema.parse(data);
        const { email, password, name, orgName, cedula, plan } = validated;

        const existingUser = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });
        if (existingUser) throw new Error("El correo ya está registrado.");

        const existingOrg = await prisma.organization.findUnique({ where: { cedula } });
        if (existingOrg) throw new Error("La cédula jurídica ya está registrada.");

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: orgName,
                    cedula: cedula,
                    plan: plan || "STARTER"
                }
            });

            const user = await tx.user.create({
                data: {
                    email: email.toLowerCase(),
                    name,
                    password: hashedPassword,
                    orgId: org.id
                }
            });

            return { user, org };
        });

        // Dynamic import for audit to avoid circular deps
        try {
            const { AuditService } = await import("@/lib/security/audit");
            await AuditService.log({
                orgId: result.org.id,
                userId: result.user.id,
                action: 'AUTH_REGISTER',
                details: { plan: result.org.plan, email: result.user.email }
            });
        } catch (auditError) {
            console.warn("Audit log failed during registration:", auditError);
        }

        return { success: true, userId: result.user.id, plan: result.org.plan };
    } catch (e: any) {
        console.error("Registration Error:", e);
        return { success: false, error: e.message };
    }
}
