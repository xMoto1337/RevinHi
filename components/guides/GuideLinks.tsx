import Link from "next/link";
import { guidesFor } from "@/lib/guides";
import { getProduct } from "@/lib/products";

/** Grid of links to one product's guide pages. `current` hides the page you're on. */
export function GuideLinks({ product, current, title = "Guides" }: { product: string; current?: string; title?: string }) {
  const { route, name } = getProduct(product);
  const guides = guidesFor(product).filter((g) => g.slug !== current);
  if (!guides.length) return null;
  return (
    <nav aria-label={`${name} guides`} className="mx-auto max-w-5xl">
      <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">{title}</h2>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={`${route}/${g.slug}`} className="glass-panel-flat block h-full rounded-2xl p-5 transition hover:bg-white/[0.07]">
              <span className="font-semibold text-white/90">{g.label}</span>
              <span className="mt-1 block text-sm text-white/55">{g.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-center text-sm">
        <Link href="/guides" className="text-white/55 underline-offset-2 transition hover:text-white/80 hover:underline">
          All RevinHi guides &rarr;
        </Link>
      </p>
    </nav>
  );
}
