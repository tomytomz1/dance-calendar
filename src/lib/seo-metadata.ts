import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const NOINDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

/**
 * Overriding `openGraph` in a page drops the image inherited from the root
 * `opengraph-image`, so hub pages reference the branded site image explicitly.
 */
const DEFAULT_SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — Find your rhythm. Find your people.`,
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
      images: [DEFAULT_SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [DEFAULT_SHARE_IMAGE.url],
    },
  };
}
