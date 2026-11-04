"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { Plus, LogOut, User, Settings, Calendar, LayoutDashboard, ChevronDown } from "lucide-react";
import { HeaderMobileNav } from "@/components/layout/header-mobile-nav";

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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0D101B]/95 shadow-[0_2px_30px_rgba(0,0,0,.2)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-10 min-w-0">
        <div className="flex items-center gap-1 min-w-0 flex-shrink">
          <HeaderMobileNav>
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                href="/events"
                className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
              >
                <Calendar className="h-5 w-5" />
                Explore Events
              </Link>
              <Link href="/calendar" className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors">
                <Calendar className="h-5 w-5" /> Dance Calendar
              </Link>
              <Link href="/events/style/salsa" className="text-lg font-medium hover:text-primary">Salsa Events</Link>
              <Link href="/events/style/bachata" className="text-lg font-medium hover:text-primary">Bachata Events</Link>
              <Link href={canCreateEvents && isVerified ? "/organizer/events/new" : "/register"} className="text-lg font-medium hover:text-primary">List your event</Link>
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
          </HeaderMobileNav>

          <Link
            href="/"
            className="flex h-full items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.button !== 0) return;
              e.preventDefault();
              window.location.href = "/";
            }}
            aria-label="Go to MichiganDance.Life homepage"
          >
            <Image
              src="/brand/logo-on-dark.svg"
              alt="Michigan Dance Life"
              width={465}
              height={82}
              className="h-10 w-auto max-w-[55vw] sm:h-12"
              priority
            />
          </Link>
        </div>

        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#F7EFE5]">
          <Link href="/calendar" className="hover:text-[#FF8179] transition-colors">Explore Events</Link>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md outline-none transition-colors hover:text-[#FF8179] focus-visible:ring-2 focus-visible:ring-[#FF8179] data-[state=open]:text-[#FF8179]">
              Dance Styles <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={12} className="w-48 rounded-xl border-[#6B4A6A] bg-[#1B1424] p-2 text-[#F7EFE5] shadow-2xl">
              {["Salsa", "Bachata", "Kizomba", "Swing", "Ballroom"].map(style => (
                <DropdownMenuItem key={style} asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold focus:bg-white/10 focus:text-[#FF8179]">
                  <Link href={"/events/style/" + style.toLowerCase()}>{style}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-[#FF9A93] focus:bg-white/10 focus:text-[#FF8179]">
                <Link href="/events">All events</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/#discover" className="hover:text-[#FF8179] transition-colors">Cities</Link>
          <Link href="/about" className="hover:text-[#FF8179] transition-colors">About</Link>
        </nav>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={canCreateEvents && isVerified ? "/organizer/events/new" : "/register"} className="hidden sm:inline-flex min-h-10 items-center rounded-full bg-[#F46157] px-5 text-sm font-bold text-[#160E18] hover:bg-[#FF8179]">List an Event</Link>
          {canCreateEvents && isVerified && (
            <Button asChild size="sm" variant="outline" className="hidden xl:flex">
              <Link
                href="/organizer/events/new"
                className="flex items-center gap-1"
                aria-label="Add Event"
              >
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Add Event</span>
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
