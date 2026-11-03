import Link from "next/link";
import { LegalLinks } from "@/components/Legal";
import { guidesFor } from "@/lib/guides";
import { PRODUCTS, SUPPORT_EMAIL } from "@/lib/products";

/**
 * Site-wide footer: every product, every guide (grouped by product, from lib/guides.ts), the guides
 * index, legal links and support email. Used on every storefront page so search engines and people
 * can reach any page from any page.
 */
export function SiteFooter() {
  const withGuides = PRODUCTS.filter((p) => guidesFor(p.slug).length > 0);
  return (
    <footer className="mt-auto border-t border-white/10 px-6 pb-10 pt-12">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">Apps</p>
          <ul className="mt-3 space-y-2">
            {PRODUCTS.map((p) => (
              <li key={p.slug}>
                <Link href={p.route} className="text-white/45 transition hover:text-white/80">
                  {p.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/guides" className="text-white/45 transition hover:text-white/80">
                All guides
              </Link>
            </li>
          </ul>
        </div>
        {withGuides.map((p) => (
          <div key={p.slug}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">{p.tabLabel} guides</p>
            <ul className="mt-3 space-y-2">
              {guidesFor(p.slug).map((g) => (
                <li key={g.slug}>
                  <Link href={`${p.route}/${g.slug}`} className="text-white/45 transition hover:text-white/80">
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/40 sm:flex-row">
        <p>&copy; {new Date().getFullYear()} RevinHi. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <LegalLinks />
        </div>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-white/70">
          {SUPPORT_EMAIL}
        </a>
      </div>
    </footer>
  );
}
