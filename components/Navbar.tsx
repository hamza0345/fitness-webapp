"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; // <-- import usePathname
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); // <-- get current path
  const { isLoggedIn, userEmail, logout } = useAuth();

  /* ------------- handlers ------------- */
  const handleLogout = () => {
    logout();          // clears token + context
    router.push("/");  // back to home (or /sign-in if you prefer)
  };

  /* -------------- render -------------- */
  return (
    <header className="bg-green-600 text-white py-4 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* ─── Brand ────────────────────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg hover:text-gray-200 transition-colors"
        >
          <Dumbbell className="h-6 w-6" />
          BodyBlueprint
        </Link>

        {/* ─── Desktop Navigation Tabs ─────────────────────────── */}
        <nav className="hidden md:flex gap-6 items-center text-sm">
          <Link
            href="/tracker"
            className={`${pathname === "/tracker" ? "underline" : "hover:underline hover:text-gray-200"}`}
          >
            Tracker
          </Link>
          <Link
            href="/routines"
            className={`${pathname === "/routines" ? "underline" : "hover:underline hover:text-gray-200"}`}
          >
            Routines
          </Link>
          <Link
            href="/improve"
            className={`${pathname === "/improve" ? "underline" : "hover:underline hover:text-gray-200"}`}
          >
            Improve
          </Link>
          <Link
            href="/rep-counter"
            className={`${pathname === "/rep-counter" ? "underline" : "hover:underline hover:text-gray-200"}`}
          >
            Rep&nbsp;Counter
          </Link>
        </nav>

        {/* ─── Auth area ───────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <span className="hidden sm:inline text-sm">
                Welcome,&nbsp;<strong>{userEmail}</strong>
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={`${pathname === "/sign-in" ? "underline" : "hover:underline hover:text-gray-200"} text-sm`}
              >
                Sign&nbsp;in
              </Link>
              <Link
                href="/register"
                className={`${pathname === "/register" ? "underline" : "hover:underline hover:text-gray-200"} text-sm`}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ─── Mobile Tabs (appear below on small screens) ───────── */}
      <div className="md:hidden container mx-auto px-4 pt-2 flex justify-center gap-4 text-sm border-t border-green-700 mt-2">
        <Link
          href="/tracker"
          className={`${pathname === "/tracker" ? "underline" : "hover:underline hover:text-gray-200"}`}
        >
          Tracker
        </Link>
        <Link
          href="/routines"
          className={`${pathname === "/routines" ? "underline" : "hover:underline hover:text-gray-200"}`}
        >
          Routines
        </Link>
        <Link
          href="/improve"
          className={`${pathname === "/improve" ? "underline" : "hover:underline hover:text-gray-200"}`}
        >
          Improve
        </Link>
        <Link
          href="/rep-counter"
          className={`${pathname === "/rep-counter" ? "underline" : "hover:underline hover:text-gray-200"}`}
        >
          Rep&nbsp;Counter
        </Link>
      </div>
    </header>
  );
}
