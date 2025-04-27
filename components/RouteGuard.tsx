"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { ReactNode } from "react";

// List of routes that require authentication
const protectedRoutes = [
  '/tracker',
  '/routines',
  '/improve',
  '/rep-counter',
];

// Routes that should be accessible to non-authenticated users
const publicRoutes = [
  '/',
  '/sign-in',
  '/register',
];

interface RouteGuardProps {
  children: ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if the current route needs protection
    const needsAuth = protectedRoutes.some(route => pathname.startsWith(route));
    
    // If the route needs auth and user is not logged in, redirect to register
    if (needsAuth && !isLoggedIn) {
      console.log("Redirecting to register - not authenticated");
      router.push('/register');
    }
  }, [isLoggedIn, pathname, router]);

  return <>{children}</>;
} 