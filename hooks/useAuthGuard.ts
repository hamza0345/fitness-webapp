"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * A hook that guards routes requiring authentication.
 * If user is not logged in, they are redirected to the sign-in page.
 * Returns a boolean indicating if user is authenticated, and a loading state.
 */
export default function useAuthGuard() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Very small timeout to ensure context is fully loaded
    const timer = setTimeout(() => {
      if (!isLoggedIn) {
        // Redirect to the sign-in page if not authenticated
        router.push("/sign-in");
      }
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoggedIn, router]);

  return isLoggedIn;
} 