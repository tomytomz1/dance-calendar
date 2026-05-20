import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl prose prose-neutral dark:prose-invert">
        <h1>{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
