import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // [SECURITY FIX] Validación de roles para rutas administrativas
        if (path.startsWith('/dashboard/qa')) {
            if (token?.role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url));
            }
        }

        // [SECURITY FIX] Validación de suscripción para emisión de facturas
        if (path.startsWith('/new')) {
            const status = token?.subscriptionStatus as string;
            // Solo permitir si es activo o si es un usuario nuevo (status null)
            if (status && status !== 'active' && status !== 'trialing') {
                return NextResponse.redirect(new URL('/dashboard/billing?error=payment_required', req.url));
            }
        }

        // [SECURITY FIX] API y Docs solo para Enterprise o Admin
        if (path.startsWith('/dashboard/api') || path.startsWith('/dashboard/docs')) {
            const plan = token?.plan as string;
            const role = token?.role as string;
            if (role !== 'ADMIN' && plan !== 'ENTERPRISE') {
                return NextResponse.redirect(new URL('/dashboard?error=plan_required', req.url));
            }
        }

        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/login",
        },
        callbacks: {
            authorized: ({ token }) => !!token
        }
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/new/:path*", "/invoices/:path*"],
};
