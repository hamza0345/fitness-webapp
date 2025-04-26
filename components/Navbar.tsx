// components/Navbar.tsx (Updated with Navigation Links)
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, getUserEmail } from "@/lib/api";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
// Optional: If you want to use toast notifications
// import { useToast } from "@/components/ui/use-toast";

export default function Navbar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  // Optional: const { toast } = useToast();

  useEffect(() => {
    const userEmail = getUserEmail();
    setEmail(userEmail);
    // console.log("User email from token:", userEmail); // Debugging line
  }, []);

  const handleLogout = () => {
    logout();
    setEmail(null);
    // Optional: toast({ title: "Logged out successfully" });
    router.push("/sign-in");
  };

  return (
    <header className="bg-green-600 text-white py-4 shadow-md"> {/* Added shadow */}
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Dumbbell className="h-6 w-6" />
          BodyBlueprint
        </Link>

        {/* Navigation Links (Tabs) - Added This Section */}
        <nav className="hidden md:flex gap-6 items-center"> {/* Hide on small screens, adjust gap */}
          <Link href="/tracker" className="hover:text-gray-200 hover:underline transition-colors">
            Tracker
          </Link>
          <Link href="/routines" className="hover:text-gray-200 hover:underline transition-colors">
            Routines
          </Link>
          <Link href="/improve" className="hover:text-gray-200 hover:underline transition-colors">
            Improve
          </Link>
          <Link href="/rep-counter" className="hover:text-gray-200 hover:underline transition-colors">
            Rep Counter
          </Link>
          {/* Add other links as needed */}
        </nav>

        {/* Auth Controls */}
        <div className="flex items-center gap-4">
          {email ? (
            // Logged IN state
            <> {/* Use Fragment to group elements */}
              <span className="text-sm hidden sm:inline">
                Welcome, <strong>{email}</strong>
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}> {/* Added size="sm" */}
                Sign out
              </Button>
            </>
          ) : (
            // Logged OUT state
            <> {/* Use Fragment to group elements */}
              <Link href="/sign-in" className="hover:text-gray-200 hover:underline transition-colors">
                Sign-in
              </Link>
              <Link href="/register" className="hover:text-gray-200 hover:underline transition-colors">
                Register
              </Link>
            </>
          )}
          {/* Consider adding a mobile menu button here for smaller screens */}
        </div>
      </div>
      {/* Optional: Mobile Navigation Links (Below main nav for smaller screens) */}
      <div className="md:hidden container mx-auto px-4 pt-2 flex justify-center gap-4 text-sm border-t border-green-700 mt-2">
          <Link href="/tracker" className="hover:text-gray-200 hover:underline transition-colors">Tracker</Link>
          <Link href="/routines" className="hover:text-gray-200 hover:underline transition-colors">Routines</Link>
          <Link href="/improve" className="hover:text-gray-200 hover:underline transition-colors">Improve</Link>
          <Link href="/rep-counter" className="hover:text-gray-200 hover:underline transition-colors">Rep Counter</Link>
      </div>
    </header>
  );
}