import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of routes that require authentication
const protectedRoutes = [
  '/tracker',
  '/routines',
  '/improve',
  '/rep-counter',
]

// Routes that should be accessible to non-authenticated users
const publicRoutes = [
  '/',
  '/sign-in',
  '/register',
]

export function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get('access')?.value

  // Get the path from the URL
  const path = request.nextUrl.pathname

  // If trying to access a protected route without being logged in, redirect to register page
  if (protectedRoutes.some(route => path.startsWith(route)) && !token) {
    const url = new URL('/register', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Configure the middleware to run on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 