import Link from "next/link";
import { FeedbackPrompt } from "@/components/FeedbackPrompt";
import { LegalLinks } from "@/components/Legal";
import { PRODUCTS, SUPPORT_EMAIL } from "@/lib/products";

/**
 * Site-wide footer: a feedback line (names the app on app/guide pages), every app, help links, legal
 * links and support email. Kept to one compact block so it doesn't grow with every new app. Guides are
 * linked from each app page, the /guides index and the sitemap, so they don't need footer columns.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 px-6 pb-10 pt-8">
      <FeedbackPrompt />
      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 text-sm sm:grid-cols-[2fr_1fr_1fr]">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">Apps</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {PRODUCTS.map((p) => (
              <li key={p.slug}>
                <Link href={p.route} className="text-white/45 transition hover:text-white/80">
                  {p.tabLabel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">Help</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/guides" className="text-white/45 transition hover:text-white/80">
                How-to guides
              </Link>
            </li>
            <li>
              <Link href="/feedback" className="text-white/45 transition hover:text-white/80">
                Send feedback
              </Link>
            </li>
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-white/45 transition hover:text-white/80">
                Email us
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">Legal</p>
          <div className="mt-3 flex flex-col gap-2 text-white/45">
            <LegalLinks />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row">
        <p>&copy; {new Date().getFullYear()} RevinHi. All rights reserved.</p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-white/70">
          {SUPPORT_EMAIL}
        </a>
      </div>
    </footer>
  );
}
