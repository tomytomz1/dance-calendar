"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DANCE_STYLES } from "@/lib/types";
import { toast } from "sonner";

interface SubscriptionPreferencesProps {
  userEmail: string;
}

export function SubscriptionPreferences({ userEmail }: SubscriptionPreferencesProps) {
  const [citiesText, setCitiesText] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => (r.ok ? r.json() : null))
      .then((sub) => {
        if (sub) {
          setCitiesText((sub.cities as string[])?.join(", ") ?? "");
          setStyles(sub.danceStyles ?? []);
          setEmailNotifications(sub.emailNotifications ?? true);
          setWeeklyDigest(sub.weeklyDigest ?? false);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleStyle = (style: string) => {
    setStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const save = async () => {
    setSaving(true);
    const cities = citiesText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          cities,
          danceStyles: styles,
          emailNotifications,
          weeklyDigest,
        }),
      });
      if (res.ok) {
        toast.success("Notification preferences saved");
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-32 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pref-cities">Cities (comma-separated)</Label>
          <Input
            id="pref-cities"
            value={citiesText}
            onChange={(e) => setCitiesText(e.target.value)}
            placeholder="Detroit, Troy, Ann Arbor"
          />
        </div>
        <div className="space-y-2">
          <Label>Dance styles</Label>
          <div className="flex flex-wrap gap-2">
            {DANCE_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                className={`text-xs px-2 py-1 rounded-full border ${
                  styles.includes(style)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
          />
          Email me about matching new events
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={weeklyDigest}
            onChange={(e) => setWeeklyDigest(e.target.checked)}
          />
          Weekly digest
        </label>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
