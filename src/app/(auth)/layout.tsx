import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo-metadata";

export const metadata: Metadata = NOINDEX_METADATA;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D101B] px-4 py-10">
      <div
        className="absolute inset-0 bg-[url('/dance/hero-mobile.webp')] bg-cover bg-center opacity-20 sm:bg-[url('/dance/hero-desktop.webp')]"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D101B]/80 via-[#0D101B]/90 to-[#0D101B]" aria-hidden="true" />
      <main className="relative w-full max-w-md">{children}</main>
    </div>
  );
}
