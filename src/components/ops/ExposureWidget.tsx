// The exposure widget (add-on §4). Deliberately not a score or a grade
// (§9.3): it shows facts — what is uncovered and the statutory maximum — never
// a prediction (§2.6).

import Link from "next/link";
import { fmtLeiRound } from "@/lib/money";
import type { ExposureSummary } from "@/server/complianceService";

export function ExposureWidget({
  summary,
  buildingId,
}: {
  summary: ExposureSummary;
  buildingId?: string;
}) {
  const href = buildingId ? `/ops/compliance?building=${buildingId}` : "/ops/compliance";
  const clean = summary.totalBani === 0 && summary.total > 0;

  return (
    <div className="rounded-xl bg-surface p-4 shadow-card">
      <p className="text-xs text-ink-faint">Maximum uncovered exposure</p>
      <p
        className={`tnum font-display mt-1 text-2xl font-bold ${clean ? "text-ok" : "text-ink"}`}
      >
        {fmtLeiRound(summary.totalBani)} lei
      </p>

      {summary.total === 0 ? (
        <p className="mt-1 text-xs text-ink-soft">
          No obligations recorded for this building yet.
        </p>
      ) : (
        <p className="tnum mt-1 text-xs text-ink-soft">
          {summary.covered} of {summary.total} obligations covered
        </p>
      )}

      {summary.largest.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-line pt-2 text-xs text-ink-soft">
          {summary.largest.map((l) => (
            <li key={l.name} className="tnum flex justify-between gap-3">
              <span className="truncate">
                {l.name}
                {l.buildings > 1 && (
                  <span className="text-ink-faint"> · {l.buildings} buildings</span>
                )}
              </span>
              <span className="shrink-0">{fmtLeiRound(l.fineMaxBani)} lei</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs leading-relaxed text-ink-faint">
        Statutory maximums, for information only.
      </p>
      <Link href={href} className="mt-1 inline-block text-xs text-moss underline">
        Open the compliance calendar
      </Link>
    </div>
  );
}
