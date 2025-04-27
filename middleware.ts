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

// This is a server-side middleware, but our authentication uses localStorage which is client-side only.
// We need to rely on client-side protection for routes since middleware can't access localStorage.
// This middleware will be limited to checking cookies only.
export function middleware(request: NextRequest) {
  // Get the path from the URL
  const path = request.nextUrl.pathname
  
  // For APIs, we can check the token in the Authorization header
  if (path.startsWith('/api/')) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

// Configure the middleware to run on API routes only
export const config = {
  matcher: [
    '/api/:path*'
  ],
} 