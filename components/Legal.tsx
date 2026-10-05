import Link from "next/link";
import type { ReactNode } from "react";

export const LEGAL_UPDATED = "October 5, 2026";

/** Footer links to /privacy and /terms (required on any page used as an ad landing page). */
export function LegalLinks() {
  return (
    <>
      <Link href="/privacy" className="transition hover:text-white/70">
        Privacy
      </Link>
      <Link href="/terms" className="transition hover:text-white/70">
        Terms
      </Link>
    </>
  );
}

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-white/50">Last updated {LEGAL_UPDATED}</p>
      <div className="legal mt-8 space-y-6 text-[15px] leading-relaxed text-white/75">{children}</div>
    </main>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-white">{heading}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
