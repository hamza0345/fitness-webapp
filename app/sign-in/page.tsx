"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dumbbell, ArrowLeft, Lock, Mail, Star } from "lucide-react";
import { login as apiLogin } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function SignInPage() {
  const router = useRouter();
  const { login: contextLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const data = await apiLogin(formData.email, formData.password);
      contextLogin(data.access);
      router.push("/routines");
    } catch (err: any) {
      setErrors({ form: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 text-primary hover:text-primary/80">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
          
          <Card className="border-2 border-secondary">
            <CardHeader className="space-y-1 bg-secondary/30">
              <div className="flex justify-center mb-2">
                <Star className="h-8 w-8 text-primary" fill="#f472b6" />
              </div>
              <CardTitle className="text-2xl font-bold text-center text-primary">Sign in</CardTitle>
              <CardDescription className="text-center font-medium text-foreground">
                Enter your email and password to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-primary" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 border-secondary"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive font-bold">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-primary" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      className="pl-10 border-secondary"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive font-bold">{errors.password}</p>}
                </div>

                {errors.form && <p className="text-sm text-destructive font-bold">{errors.form}</p>}

                <Button className="w-full bg-primary hover:bg-primary/80" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col bg-secondary/20 justify-center">
              <p className="text-sm text-center font-medium">Don't have an account? <Link href="/register" className="text-primary hover:underline font-bold">Register here</Link></p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
