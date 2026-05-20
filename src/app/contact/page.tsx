import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Contact",
  description: `Contact ${SITE_NAME}`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <LegalPageShell title="Contact">
      <p>
        For questions about listings, organizer accounts, or the calendar,
        reach out to the {SITE_NAME} team.
      </p>
      <p>
        Email:{" "}
        <a href="mailto:hello@michigandance.life">hello@michigandance.life</a>
        {" "}
        (update this address to your real inbox in production)
      </p>
      <p>
        To list an event,{" "}
        <a href="/register">create an organizer account</a>.
      </p>
    </LegalPageShell>
  );
}
