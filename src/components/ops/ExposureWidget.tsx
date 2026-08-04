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
      <p className="text-xs text-ink-faint">Expunere maximă neacoperită</p>
      <p
        className={`tnum font-display mt-1 text-2xl font-bold ${clean ? "text-ok" : "text-ink"}`}
      >
        {fmtLeiRound(summary.totalBani)} lei
      </p>

      {summary.total === 0 ? (
        <p className="mt-1 text-xs text-ink-soft">
          Nicio obligație înregistrată încă pentru acest imobil.
        </p>
      ) : (
        <p className="tnum mt-1 text-xs text-ink-soft">
          {summary.covered} din {summary.total} obligații acoperite
        </p>
      )}

      {summary.largest.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-line pt-2 text-xs text-ink-soft">
          {summary.largest.map((l) => (
            <li key={l.nameRo} className="tnum flex justify-between gap-3">
              <span className="truncate">
                {l.nameRo}
                {l.buildings > 1 && (
                  <span className="text-ink-faint"> · {l.buildings} imobile</span>
                )}
              </span>
              <span className="shrink-0">{fmtLeiRound(l.fineMaxBani)} lei</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs leading-relaxed text-ink-faint">
        Valori maxime prevăzute de lege, cu titlu informativ.
      </p>
      <Link href={href} className="mt-1 inline-block text-xs text-moss underline">
        Vezi calendarul de conformitate
      </Link>
    </div>
  );
}
