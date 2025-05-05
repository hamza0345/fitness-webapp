import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware checks Authentication headers for API routes only
export function middleware(request: NextRequest) {
  // Get the path from the URL
  const path = request.nextUrl.pathname
  
  // For APIs, check the token in the Authorization header
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