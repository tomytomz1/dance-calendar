import Link from "next/link";
import { SITE_NAME } from "@/lib/seo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-2">{SITE_NAME}</p>
            <p className="text-muted-foreground">
              Michigan&apos;s calendar for salsa, bachata, swing, and ballroom
              events.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Explore</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <Link href="/events" className="hover:text-primary">
                  All events
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary">
                  About
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-primary">
                  List your event
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Legal</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-primary">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/unsubscribe" className="hover:text-primary">
                  Unsubscribe
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-8 text-center">
          © {year} {SITE_NAME}. All rights reserved.
          <span className="mt-2 block">Built by <a href="https://beltran.digital/" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Beltrán Digital</a></span>
        </p>
      </div>
    </footer>
  );
}
