import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { NOINDEX_METADATA } from "@/lib/seo-metadata";

export const metadata: Metadata = NOINDEX_METADATA;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {children}
      </main>
    </div>
  );
}
