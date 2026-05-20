"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderMobileNavProps {
  children: React.ReactNode;
}

/**
 * Radix Sheet generates aria-controls IDs that can mismatch between SSR and
 * client hydration. Render the sheet only after mount.
 */
export function HeaderMobileNav({ children }: HeaderMobileNavProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        type="button"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        {children}
      </SheetContent>
    </Sheet>
  );
}
