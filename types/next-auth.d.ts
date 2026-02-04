import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            orgId: string | null;
            role: string;
            plan?: string;
            haciendaEnv?: string;
            subscriptionStatus?: string;
            haciendaUser?: string;
            hasHaciendaP12?: boolean;
            cedula?: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        orgId: string | null;
        role: string;
        plan?: string;
        haciendaEnv?: string;
        subscriptionStatus?: string;
        haciendaUser?: string;
        hasHaciendaP12?: boolean;
        cedula?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        orgId: string | null;
        role: string;
        plan?: string;
        haciendaEnv?: string;
        subscriptionStatus?: string;
    }
}
