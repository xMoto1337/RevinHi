import type { LucideIcon } from "lucide-react";

export type Feature = { title: string; description: string; icon: LucideIcon };

/**
 * "What it does" cards for app pages: a line icon in a softly tinted glass tile (the app's accent),
 * title and one or two plain sentences. Replaces the old plain colored squares.
 */
export function FeatureGrid({ features, accent }: { features: Feature[]; accent: string }) {
  return (
    <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {features.map(({ title, description, icon: Icon }) => (
        <div key={title} className="glass-panel-flat group rounded-2xl p-6 transition hover:border-white/25 hover:bg-white/[0.07]">
          <div
            className="mb-4 grid h-11 w-11 place-items-center rounded-xl border transition group-hover:scale-105"
            style={{ background: `${accent}1f`, borderColor: `${accent}55`, color: accent, boxShadow: `0 0 22px ${accent}22` }}
          >
            <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
        </div>
      ))}
    </div>
  );
}
