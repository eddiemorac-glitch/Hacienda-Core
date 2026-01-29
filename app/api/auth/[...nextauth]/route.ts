
import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth-options";

/**
 * [AUTH ENGINE - ENTRYPOINT]
 * Using dynamic options generation to ensure clean initialization.
 */
const handler = (req: any, res: any) => NextAuth(req, res, getAuthOptions());

export { handler as GET, handler as POST };
