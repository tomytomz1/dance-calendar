"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Mail, Shield, CheckCircle, XCircle } from "lucide-react";
import {
  normalizeWebsite,
  PROFILE_LIMITS,
  validateProfileInput,
  type ProfileField,
  type ProfileInput,
} from "@/lib/profile-input";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm font-medium text-red-400">
      {message}
    </p>
  );
}

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  verified: boolean;
  bio: string | null;
  phone: string | null;
  website: string | null;
  createdAt: string;
}

interface ProfileFormProps {
  initialData: ProfileData;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [saved, setSaved] = useState<ProfileInput>({
    name: initialData.name || "",
    bio: initialData.bio || "",
    phone: initialData.phone || "",
    website: initialData.website || "",
  });
  const [name, setName] = useState(saved.name);
  const [bio, setBio] = useState(saved.bio);
  const [phone, setPhone] = useState(saved.phone);
  const [website, setWebsite] = useState(saved.website);
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { update: updateSession } = useSession();
  const isOrganizer = initialData.role !== "USER";

  const isDirty =
    name !== saved.name ||
    bio !== saved.bio ||
    phone !== saved.phone ||
    website !== saved.website;

  // Warn before closing/reloading the tab with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const clearError = (field: ProfileField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError(null);
  };

  const handleSave = async () => {
    const input: ProfileInput = { name, bio, phone, website };
    const clientErrors = validateProfileInput(input);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setFormError("Not saved yet. Fix the highlighted field and tap Save again.");
      document.getElementById(Object.keys(clientErrors)[0])?.focus();
      return;
    }

    const normalizedWebsite = normalizeWebsite(website);
    setWebsite(normalizedWebsite);
    setErrors({});
    setFormError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio || null,
          phone: phone.trim() || null,
          website: normalizedWebsite,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        const next: ProfileInput = {
          name: updated.name || "",
          bio: updated.bio || "",
          phone: updated.phone || "",
          website: updated.website || "",
        };
        setSaved(next);
        setName(next.name);
        setBio(next.bio);
        setPhone(next.phone);
        setWebsite(next.website);
        toast.success("Profile saved");
        // Refresh the login session so the header/menu shows the new name
        // right away, then re-render server data on this page. A failure here
        // must not look like the save failed — the data is already stored.
        try {
          await updateSession({ name: updated.name });
        } catch {
          /* header name will catch up on next page load */
        }
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        const message = data.error || "Failed to update profile";
        if (data.field && ["name", "bio", "phone", "website"].includes(data.field)) {
          setErrors({ [data.field as ProfileField]: message });
        }
        setFormError(`Not saved: ${message}`);
        toast.error(message);
      }
    } catch {
      setFormError("Not saved: connection problem. Please try again.");
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabel = {
    USER: "User",
    ORGANIZER: "Organizer",
    ADMIN: "Admin",
  }[initialData.role] || initialData.role;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={initialData.image || ""} alt={saved.name} />
              <AvatarFallback className="text-xl">
                {saved.name.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{saved.name || "No name set"}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {initialData.email}
              </div>
            </div>
          </div>

          <Separator className="mb-4" />

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Role:</span>
              <Badge variant="secondary">{roleLabel}</Badge>
            </div>
            {initialData.role !== "USER" && (
              <div className="flex items-center gap-1.5">
                {initialData.verified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-500">Pending Approval</span>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {isOrganizer ? "Name / Academy or Studio Name" : "Name"}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
              placeholder={isOrganizer ? "Your academy, studio or organizer name" : "Your name"}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            <FieldError id="name-error" message={errors.name} />
            {isOrganizer && (
              <p className="text-xs text-muted-foreground">
                Shown as the organizer on all of your events.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                clearError("bio");
              }}
              placeholder={isOrganizer ? "Tell dancers about your academy or events..." : "Tell us about yourself..."}
              rows={3}
              maxLength={PROFILE_LIMITS.bioMax}
              aria-invalid={!!errors.bio}
            />
            <FieldError id="bio-error" message={errors.bio} />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/{PROFILE_LIMITS.bioMax}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearError("phone");
              }}
              placeholder="Your phone number"
              type="tel"
              maxLength={PROFILE_LIMITS.phoneMax}
              aria-invalid={!!errors.phone}
            />
            <FieldError id="phone-error" message={errors.phone} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => {
                setWebsite(e.target.value);
                clearError("website");
              }}
              onBlur={() => setWebsite((w) => normalizeWebsite(w))}
              placeholder="yourwebsite.com"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={!!errors.website}
            />
            <FieldError id="website-error" message={errors.website} />
          </div>

          {/* Sticky so it stays reachable above mobile browser toolbars. */}
          <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-10 -mx-2 space-y-2 rounded-lg bg-card/95 p-2 backdrop-blur md:bottom-4">
            {formError ? (
              <p role="alert" className="text-sm font-medium text-red-400">
                {formError}
              </p>
            ) : isDirty ? (
              <p className="text-sm text-amber-400">
                You have unsaved changes. Tap Save Changes to keep them.
              </p>
            ) : null}
            <Button onClick={handleSave} disabled={isSaving || !isDirty} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
