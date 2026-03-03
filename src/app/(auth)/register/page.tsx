"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Music, CalendarPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Role = "dancer" | "organizer" | null;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const isOrganizer = selectedRole === "organizer";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, isOrganizer }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Registration failed");
      } else {
        toast.success(data.message);
        router.push("/login");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (step === 1) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">How will you use the app?</CardTitle>
          <CardDescription>
            Choose your role to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            onClick={() => setSelectedRole("dancer")}
            className={cn(
              "w-full rounded-xl border-2 px-5 py-4 text-left transition-all",
              selectedRole === "dancer"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            )}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                selectedRole === "dancer" ? "bg-primary/15" : "bg-muted"
              )}>
                <Music className={cn(
                  "w-5 h-5",
                  selectedRole === "dancer" ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-semibold">Dancer</p>
                <p className="text-sm text-muted-foreground">
                  Browse and discover dance events
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("organizer")}
            className={cn(
              "w-full rounded-xl border-2 px-5 py-4 text-left transition-all",
              selectedRole === "organizer"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            )}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                selectedRole === "organizer" ? "bg-primary/15" : "bg-muted"
              )}>
                <CalendarPlus className={cn(
                  "w-5 h-5",
                  selectedRole === "organizer" ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-semibold">Organizer</p>
                <p className="text-sm text-muted-foreground">
                  Create and manage dance events
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Requires admin approval
                </p>
              </div>
            </div>
          </button>

          <Button
            className="w-full h-12 mt-2"
            disabled={selectedRole === null}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {isOrganizer ? (
              <CalendarPlus className="w-8 h-8 text-primary" />
            ) : (
              <Music className="w-8 h-8 text-primary" />
            )}
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Join the dance community today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Registering as:</span>
            <Badge variant="secondary" className="font-medium">
              {isOrganizer ? "Organizer" : "Dancer"}
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Change
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              disabled={isLoading}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="••••••••"
              required
              minLength={8}
              disabled={isLoading}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              required
              minLength={8}
              disabled={isLoading}
              className="h-12"
            />
          </div>
          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
