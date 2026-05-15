import { z } from "zod";

function isHttpOrHttps(u: string): boolean {
  return /^https?:\/\//i.test(u);
}

/** Required URL that must use http or https scheme (blocks javascript:, data:, etc.). */
export function httpOrHttpsUrl(message = "URL must start with http:// or https://") {
  return z.string().url().refine(isHttpOrHttps, { message });
}

/** Optional event link fields: omitted, empty string, or a valid http(s) URL. */
export const optionalEmptyOrHttpUrl = z
  .union([z.literal(""), httpOrHttpsUrl()])
  .optional();

/** Profile website: empty, null, or http(s) URL (http://localhost allowed in development). */
export const optionalProfileWebsite = z
  .union([
    z.literal(""),
    z.null(),
    z.string().url("Must be a valid URL").refine(
      (u) => {
        if (process.env.NODE_ENV === "development" && /^http:\/\/localhost\b/i.test(u)) {
          return true;
        }
        return isHttpOrHttps(u);
      },
      { message: "URL must start with http:// or https://" }
    ),
  ])
  .optional()
  .nullable();
