import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days persistence
        updateAge: 24 * 60 * 60,   // Update session every 24 hours
    },
    pages: {
        signIn: "/login",
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
                    throw new Error("Credenciales inválidas");
                }

                const email = credentials.email.toLowerCase();
                console.log(`[AUTH_DEBUG] Attempting login for: ${email}`);

                const user = await prisma.user.findFirst({
                    where: {
                        email: {
                            equals: email,
                            mode: 'insensitive'
                        }
                    },
                    include: { organization: true }
                });

                if (!user) {
                    console.log(`[AUTH_DEBUG] User not found: ${email}`);
                    throw new Error("Usuario no encontrado");
                }

                // [EMERGENCY RECOVERY] Removed for security compliance.

                const isValid = await bcrypt.compare(credentials.password, user.password as string);

                if (!isValid) {
                    console.log(`[AUTH_DEBUG] Invalid password for: ${email}`);
                    throw new Error("Contraseña incorrecta");
                }

                console.log(`[AUTH_DEBUG] Login successful for: ${email}`);
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
        async jwt({ token, user }) {
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
};
