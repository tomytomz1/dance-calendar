"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EmailSubscribeProps {
  className?: string;
}

export function EmailSubscribe({ className }: EmailSubscribeProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message ?? "Subscribed!");
        setName("");
        setEmail("");
      } else {
        toast.error(data.error ?? "Could not subscribe");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={cn("rounded-xl border bg-card p-6 my-8", className)}
      aria-labelledby="subscribe-heading"
    >
      <h2 id="subscribe-heading" className="text-lg font-semibold mb-1">
        Get Michigan dance event alerts
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        New socials and classes near you — no account required.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sub-name">Name</Label>
          <Input
            id="sub-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub-email">Email</Label>
          <Input
            id="sub-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Subscribing…" : "Subscribe"}
        </Button>
      </form>
    </section>
  );
}
