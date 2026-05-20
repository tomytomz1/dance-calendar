import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE_NAME}`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p>Last updated: May 2026</p>
      <p>
        {SITE_NAME} (&quot;we&quot;) operates michigandance.life. This page
        explains what data we collect and how we use it.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account data: name, email, password (hashed), profile details</li>
        <li>Event data submitted by organizers</li>
        <li>Subscription preferences (name, email, and optional cities or dance styles)</li>
        <li>Usage data via analytics when enabled (see below)</li>
      </ul>
      <h2>How we use data</h2>
      <p>
        To operate the calendar, send optional event notifications, authenticate
        users, and improve the service.
      </p>
      <h2>Analytics</h2>
      <p>
        We may use privacy-friendly analytics (e.g. Plausible) or Google
        Analytics if configured. You can use browser extensions to opt out.
      </p>
      <h2>Email</h2>
      <p>
        You can unsubscribe from marketing/event emails at any time via the link
        in emails or our unsubscribe page.
      </p>
      <h2>Contact</h2>
      <p>
        Questions: see our <a href="/contact">contact page</a>.
      </p>
    </LegalPageShell>
  );
}
