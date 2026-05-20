"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DANCE_STYLES } from "@/lib/types";
import { toast } from "sonner";

const POPULAR_CITIES = [
  "Detroit",
  "Ann Arbor",
  "Grand Rapids",
  "Lansing",
  "Troy",
  "Dearborn",
];

export function EmailSubscribe() {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleStyle = (style: string) => {
    setStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          cities: city ? [city] : [],
          danceStyles: styles,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message ?? "Subscribed!");
        setEmail("");
        setCity("");
        setStyles([]);
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
    <section className="rounded-xl border bg-card p-6 my-8" aria-labelledby="subscribe-heading">
      <h2 id="subscribe-heading" className="text-lg font-semibold mb-1">
        Get Michigan dance event alerts
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        New socials and classes in your city — no account required.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sub-email">Email</Label>
          <Input
            id="sub-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub-city">City (optional)</Label>
          <Input
            id="sub-city"
            list="mi-cities"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Detroit"
          />
          <datalist id="mi-cities">
            {POPULAR_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label>Dance styles (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {DANCE_STYLES.slice(0, 8).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  styles.includes(style)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Subscribing…" : "Subscribe"}
        </Button>
      </form>
    </section>
  );
}
