import { pinProcessTimeZone } from "@/lib/timezone";

/**
 * Runs once when each server instance boots (before any request is handled).
 * Pins the Node.js runtime to Michigan time — see pinProcessTimeZone.
 */
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    pinProcessTimeZone();
  }
}
