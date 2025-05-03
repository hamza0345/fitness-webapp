/* /app/layout.tsx */
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { WorkoutProvider } from "@/context/WorkoutContext";
import Navbar from "@/components/Navbar";
import RouteGuard from "@/components/RouteGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BodyBlueprint",
  description: "Fitness web-app for uni project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <WorkoutProvider>
            <Navbar />
            <RouteGuard>
              {children}
            </RouteGuard>
          </WorkoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
