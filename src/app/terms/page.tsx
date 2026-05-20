import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Terms of Use",
  description: `Terms of use for ${SITE_NAME}`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Use">
      <p>Last updated: May 2026</p>
      <p>
        By using {SITE_NAME}, you agree to these terms. If you do not agree,
        please do not use the site.
      </p>
      <h2>User content</h2>
      <p>
        Organizers are responsible for the accuracy of event listings (dates,
        prices, venues, links). We may remove or reject content that is
        misleading, unsafe, or spam.
      </p>
      <h2>No warranty</h2>
      <p>
        Events are listed for convenience. We do not guarantee attendance,
        quality, or safety at third-party venues.
      </p>
      <h2>Accounts</h2>
      <p>
        Keep your login secure. You are responsible for activity under your
        account.
      </p>
      <h2>Changes</h2>
      <p>We may update these terms; continued use constitutes acceptance.</p>
    </LegalPageShell>
  );
}
