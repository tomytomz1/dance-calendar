import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const NOINDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export function buildPublicPageMetadata(options: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonical = options.path.startsWith("/") ? options.path : `/${options.path}`;
  return {
    title: options.title,
    description: options.description,
    alternates: { canonical },
    openGraph: {
      title: options.title,
      description: options.description,
      url: `${SITE_URL}${canonical}`,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
    },
  };
}
