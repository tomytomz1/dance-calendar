"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailSubscribe } from "@/components/home/email-subscribe";

const DISMISS_STORAGE_KEY = "michigandance-home-subscribe-dismissed";

export function HomeEmailSubscribe() {
  const { data: session, status } = useSession();
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_STORAGE_KEY) === "1");
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  if (!hydrated || status === "loading") {
    return null;
  }

  if (session?.user) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t">
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
          aria-label="Dismiss email alerts signup"
        >
          <X className="h-4 w-4" />
        </Button>
        <EmailSubscribe className="my-0" />
      </div>
    </div>
  );
}
