import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-do-not-use-in-prod';

// Helper to verify token in middleware (cannot use lib/auth.js due to Edge Runtime constraints sometimes, keeping it simple here)
async function verifyToken(token) {
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Define protected routes
    const isAdminRoute = pathname.startsWith('/admin');
    const isCrmRoute = pathname.startsWith('/crm');

    // 2. Allow public routes
    if (!isAdminRoute && !isCrmRoute) {
        return NextResponse.next();
    }

    // 3. Check for session token
    const token = request.cookies.get('session_token')?.value;

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 4. Verify token
    const payload = await verifyToken(token);

    if (!payload) {
        // Invalid token, redirect to login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // 5. Check Role Permissions
    if (isAdminRoute && payload.role !== 'admin') {
        // User is logged in but not admin, redirect to CRM dashboard or 403
        return NextResponse.redirect(new URL('/crm', request.url));
    }

    // 6. Add user info to headers for easier access in server components (optional)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: ['/crm/:path*', '/admin/:path*'],
};
