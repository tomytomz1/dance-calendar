import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/providers/session-provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { Analytics } from "@vercel/analytics/next";
import { ThirdPartyAnalytics } from "@/components/analytics";
import { JsonLdScript } from "@/components/seo/json-ld";
import {
  SITE_NAME,
  SITE_URL,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultDescription =
  "Find salsa, bachata, kizomba, swing, and ballroom dance events across Michigan. Updated calendar of socials, classes, and parties near you.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Salsa, Bachata, Swing & Ballroom Events in Michigan`,
    template: `%s | ${SITE_NAME}`,
  },
  description: defaultDescription,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
    ],
    // iOS home-screen icon (Safari otherwise requests a missing /apple-touch-icon.png)
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Dance Events in Michigan`,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Dance Events in Michigan`,
    description: defaultDescription,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0D101B" },
    { media: "(prefers-color-scheme: dark)", color: "#0D101B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <JsonLdScript
          data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]}
        />
        <SessionProvider>
          {children}
          <Toaster position="top-center" richColors />
          <ServiceWorkerRegister />
          <Analytics />
          <ThirdPartyAnalytics />
        </SessionProvider>
      </body>
    </html>
  );
}
