import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Define protected routes that require authentication
const protectedRoutes = [
  '/profile',
  '/account',
  '/settings',
];

// Define routes that should redirect authenticated users
const authRoutes = [
  '/auth/signin',
  '/auth/signup',
];

// Simple function to check if a session cookie exists
function hasSessionCookie(request: NextRequest): boolean {
  // Check for the presence of an auth cookie (adjust the name based on your auth implementation)
  return request.cookies.has('better-auth.session-token');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Simple session check based on cookie presence
  const isAuthenticated = hasSessionCookie(request);
  
  // Check if the route is protected and user is not authenticated
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Check if the route is an auth route and user is already authenticated
  if (authRoutes.some(route => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     * - api routes (API endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};