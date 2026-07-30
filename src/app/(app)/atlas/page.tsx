import type { Metadata } from "next";
import { ATLAS_LAST_UPDATED, COMMUNES } from "./atlasData";

export const metadata: Metadata = { title: "Atlas · Scara" };

// Atlas Cut 1 (§6b): commune cards from baked constants. Cut 2 (field notebook,
// document shelf, quoted-pipeline stat row) arrives with the database in Phase 2.
export default function AtlasPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Atlas: the Giroc belt</h1>
        <p className="text-xs text-ink-faint">
          Last updated {ATLAS_LAST_UPDATED} · curated monthly from public sources
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {COMMUNES.map((c) => (
          <article key={c.key} className="rounded-xl bg-surface p-4 shadow-card">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">{c.name}</h2>
              <span className="rounded-full bg-moss-wash px-2.5 py-0.5 text-xs font-medium text-moss-deep">
                {c.wave}
              </span>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row label="Population" value={c.population} />
              <Row label="Trajectory" value={c.growth} />
              <Row label="Development" value={c.projectsPerYear} />
              <Row label="Block stock" value={c.blocksEst} />
              <Row label="Short-lets" value={c.shortLets} />
              <Row label="Rent level" value={c.rentLevel} />
            </dl>
            <p className="mt-3 border-t border-line pt-2.5 text-sm leading-relaxed text-ink-soft">
              {c.note}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const empty = value.startsWith("no data");
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-ink-faint">{label}</dt>
      <dd className={`text-right ${empty ? "italic text-ink-faint" : "text-ink"}`}>{value}</dd>
    </div>
  );
}
