import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Unsubscribe",
  description: "Manage email notifications from MichiganDance.Life",
  path: "/unsubscribe",
});

export default function UnsubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
