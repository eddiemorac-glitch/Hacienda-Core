import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            orgId: string | null;
            role: string;
            plan?: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        orgId: string | null;
        role: string;
        plan?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        orgId: string | null;
        role: string;
        plan?: string;
    }
}
