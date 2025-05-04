"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, userEmail, logout } = useAuth();

  /* ------------- handlers ------------- */
  const handleLogout = () => {
    logout();          // clears token + context
    router.push("/");  // back to home (or /sign-in if you prefer)
  };

  /* -------------- render -------------- */
  return (
    <header className="bg-background border-b-2 border-secondary py-3 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* ─── Brand ────────────────────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors"
        >
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="text-foreground">BodyBlueprint</span>
        </Link>

        {/* ─── Desktop Navigation Tabs ─────────────────────────── */}
        <nav className="hidden md:flex gap-5 items-center text-sm">
          <Link
            href="/tracker"
            className={`${pathname === "/tracker" ? "font-bold text-primary" : "hover:text-primary"} px-2 py-1`}
          >
            Tracker
          </Link>
          <Link
            href="/routines"
            className={`${pathname === "/routines" ? "font-bold text-primary" : "hover:text-primary"} px-2 py-1`}
          >
            Routines
          </Link>
          <Link
            href="/improve"
            className={`${pathname === "/improve" ? "font-bold text-primary" : "hover:text-primary"} px-2 py-1`}
          >
            Improve
          </Link>
          <Link
            href="/rep-counter"
            className={`${pathname === "/rep-counter" ? "font-bold text-primary" : "hover:text-primary"} px-2 py-1`}
          >
            Rep&nbsp;Counter
          </Link>
        </nav>

        {/* ─── Auth area ───────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <span className="hidden sm:inline text-sm font-medium">
                Welcome
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-primary border-primary/40 hover:bg-primary/10 font-medium"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={`${pathname === "/sign-in" ? "font-bold text-primary" : "hover:text-primary"} text-sm font-medium px-2 py-1`}
              >
                Sign&nbsp;in
              </Link>
              <Link
                href="/register"
                className={`${pathname === "/register" ? "font-bold text-primary" : "hover:text-primary"} text-sm font-medium px-2 py-1`}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ─── Mobile Tabs (appear below on small screens) ───────── */}
      <div className="md:hidden container mx-auto px-4 pt-2 flex justify-center gap-4 text-sm border-t border-secondary mt-2">
        <Link
          href="/tracker"
          className={`${pathname === "/tracker" ? "font-bold text-primary" : "hover:text-primary"}`}
        >
          Tracker
        </Link>
        <Link
          href="/routines"
          className={`${pathname === "/routines" ? "font-bold text-primary" : "hover:text-primary"}`}
        >
          Routines
        </Link>
        <Link
          href="/improve"
          className={`${pathname === "/improve" ? "font-bold text-primary" : "hover:text-primary"}`}
        >
          Improve
        </Link>
        <Link
          href="/rep-counter"
          className={`${pathname === "/rep-counter" ? "font-bold text-primary" : "hover:text-primary"}`}
        >
          Rep&nbsp;Counter
        </Link>
      </div>
    </header>
  );
}
