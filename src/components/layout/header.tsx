"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Plus, LogOut, User, Settings, Calendar, LayoutDashboard } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const [pendingCount, setPendingCount] = useState(0);

  const isAdmin = session?.user?.role === "ADMIN";
  const canCreateEvents =
    session?.user?.role === "ORGANIZER" || isAdmin;
  const isVerified = session?.user?.verified;

  const fetchPendingCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pending-counts");
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.pendingEvents + data.pendingOrganizers);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const tick = () => void fetchPendingCounts();
    const id = setTimeout(tick, 0);
    const interval = setInterval(tick, 60000);
    return () => {
      clearTimeout(id);
      clearInterval(interval);
    };
  }, [isAdmin, fetchPendingCounts]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between w-full px-4">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                {canCreateEvents && (
                  <Link
                    href="/organizer/events"
                    className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    My Events
                  </Link>
                )}
                {session && (
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Admin Dashboard
                    {pendingCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.button !== 0) return;
              e.preventDefault();
              window.location.href = "/";
            }}
            aria-label="Go to homepage"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <span className="font-bold text-lg hidden sm:inline truncate">
              Dance Calendar
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {canCreateEvents && isVerified && (
            <Button asChild size="sm" className="flex">
              <Link href="/organizer/events/new" className="flex items-center gap-1">
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Link>
            </Button>
          )}

          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={session.user.image || ""}
                      alt={session.user.name || ""}
                    />
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isAdmin && pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center justify-between w-full">
                      <span className="flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </span>
                      {pendingCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                )}
                {canCreateEvents && (
                  <DropdownMenuItem asChild>
                    <Link href="/organizer/events">
                      <Calendar className="mr-2 h-4 w-4" />
                      My Events
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
