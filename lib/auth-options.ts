
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

/**
 * [AUTH CONFIGURATION] - Centralized Security Policy
 * Using a factory function to defer initialization and avoid circular dependencies.
 */
export function getAuthOptions(): NextAuthOptions {
    return {
        session: {
            strategy: "jwt",
            maxAge: 30 * 24 * 60 * 60, // 30 days
            updateAge: 24 * 60 * 60, // 24 hours
        },
        pages: {
            signIn: "/login",
            error: "/login",
        },
        providers: [
            CredentialsProvider({
                name: "credentials",
                credentials: {
                    email: { label: "Email", type: "email" },
                    password: { label: "Password", type: "password" },
                },
                async authorize(credentials) {
                    if (!credentials?.email || !credentials?.password) {
                        throw new Error("Credenciales requeridas");
                    }

                    const email = credentials.email.toLowerCase();

                    // 1. Fetch user
                    const user = await prisma.user.findFirst({
                        where: { email: { equals: email, mode: 'insensitive' } },
                        include: { organization: true }
                    });

                    if (!user) {
                        throw new Error("Usuario no encontrado");
                    }

                    // 2. Validate Password
                    const isValid = await bcrypt.compare(credentials.password, user.password as string);

                    if (!isValid) {
                        throw new Error("Contraseña incorrecta");
                    }

                    // 3. Return User Session Payload
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        orgId: user.orgId,
                        role: user.role,
                        plan: user.organization?.plan,
                        subscriptionStatus: user.organization?.subscriptionStatus
                    };
                },
            }),
        ],
        callbacks: {
            async jwt({ token, user, trigger, session }) {
                if (trigger === "update" && session) {
                    return { ...token, ...session.user };
                }

                if (user) {
                    token.id = user.id;
                    token.orgId = user.orgId;
                    token.role = user.role;
                    token.plan = (user as any).plan;
                    token.subscriptionStatus = (user as any).subscriptionStatus;
                }
                return token;
            },
            async session({ session, token }) {
                if (token && session.user) {
                    (session.user as any).id = token.id;
                    (session.user as any).orgId = token.orgId;
                    (session.user as any).role = token.role;
                    (session.user as any).plan = token.plan;
                    (session.user as any).subscriptionStatus = token.subscriptionStatus;
                }
                return session;
            },
        },
        debug: process.env.NODE_ENV === 'development',
        secret: process.env.NEXTAUTH_SECRET,
    };
}

// Backwards compatibility if needed, but discouraged
// export const authOptions = getAuthOptions();
