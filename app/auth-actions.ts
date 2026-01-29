
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
    console.log('[REGISTER] Starting registration process...');
    try {
        const validated = RegisterSchema.parse(data);
        console.log('[REGISTER] Validation passed for:', validated.email);
        const { email, password, name, orgName, cedula, plan } = validated;

        console.log('[REGISTER] Checking existing user...');
        const existingUser = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });
        if (existingUser) throw new Error("El correo ya está registrado.");

        console.log('[REGISTER] Checking existing org...');
        const existingOrg = await prisma.organization.findUnique({ where: { cedula } });
        if (existingOrg) throw new Error("La cédula jurídica ya está registrada.");

        console.log('[REGISTER] Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10); // Reduced from 12 to 10 for serverless speed
        console.log('[REGISTER] Password hashed successfully');

        console.log('[REGISTER] Starting database transaction...');
        const result = await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: orgName,
                    cedula: cedula,
                    plan: plan || "STARTER"
                }
            });
            console.log('[REGISTER] Organization created:', org.id);

            const user = await tx.user.create({
                data: {
                    email: email.toLowerCase(),
                    name,
                    password: hashedPassword,
                    orgId: org.id
                }
            });
            console.log('[REGISTER] User created:', user.id);

            return { user, org };
        });
        console.log('[REGISTER] Transaction completed successfully');

        // Skip audit log to speed up registration - it's not critical
        // The audit was causing delays due to dynamic import
        console.log('[REGISTER] Registration complete, returning success');
        return { success: true, userId: result.user.id, plan: result.org.plan };
    } catch (e: any) {
        console.error("[REGISTER] Registration Error:", e.message || e);
        return { success: false, error: e.message || 'Error desconocido durante el registro.' };
    }
}
