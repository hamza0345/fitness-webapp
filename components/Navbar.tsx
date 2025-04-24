"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, getUserEmail } from "@/lib/api";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getUserEmail());
  }, []);

  const handleLogout = () => {
    logout();
    setEmail(null);
    router.push("/sign-in");
  };

  return (
    <header className="bg-green-600 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Dumbbell className="h-6 w-6" />
          BodyBlueprint
        </Link>

        {email ? (
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:inline">
              Welcome, <strong>{email}</strong>
            </span>
            <Button variant="secondary" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link href="/sign-in">Sign-in</Link>
            <Link href="/register">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
}
