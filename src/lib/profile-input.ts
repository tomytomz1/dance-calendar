/**
 * Helpers shared by the profile form (client) and the profile API (server)
 * so both accept the same input and report the same problems.
 */

export const PROFILE_LIMITS = {
  nameMin: 2,
  bioMax: 500,
  phoneMax: 20,
} as const;

export type ProfileField = "name" | "bio" | "phone" | "website";

/**
 * Turn what people actually type into a valid website URL:
 * "madancelab.com" / "www.madancelab.com" -> "https://madancelab.com".
 * Empty input stays empty. Anything that already has a scheme is left alone
 * (the validator then rejects non-http(s) schemes such as javascript:).
 */
export function normalizeWebsite(input: string | null | undefined): string {
  const value = (input ?? "").trim();
  if (!value) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}

function isValidWebsite(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    return url.hostname.includes(".") || url.hostname === "localhost";
  } catch {
    return false;
  }
}

export interface ProfileInput {
  name: string;
  bio: string;
  phone: string;
  website: string;
}

/** Client-side check mirroring the API schema. Returns per-field messages. */
export function validateProfileInput(
  input: ProfileInput
): Partial<Record<ProfileField, string>> {
  const errors: Partial<Record<ProfileField, string>> = {};
  if (input.name.trim().length < PROFILE_LIMITS.nameMin) {
    errors.name = `Name must be at least ${PROFILE_LIMITS.nameMin} characters`;
  }
  if (input.bio.length > PROFILE_LIMITS.bioMax) {
    errors.bio = `Bio must be ${PROFILE_LIMITS.bioMax} characters or less`;
  }
  if (input.phone.trim().length > PROFILE_LIMITS.phoneMax) {
    errors.phone = `Phone must be ${PROFILE_LIMITS.phoneMax} characters or less`;
  }
  const website = normalizeWebsite(input.website);
  if (website && !isValidWebsite(website)) {
    errors.website = "Enter a valid website, e.g. https://yourstudio.com";
  }
  return errors;
}
