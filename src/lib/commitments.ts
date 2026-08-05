// "Angajamentele noastre" — the service commitments (add-on 2 §C4).
//
// These are promises about *speed*, not giveaways: nothing here is free, a
// discount, or a refund. No Romanian cleaning firm publishes a single response
// time, which is why a published one is worth more than a guarantee nobody can
// price.
//
// The point of this file is the second half of §C4: "the commitments must be
// measurable in the app". A promise printed on a wall is marketing; a promise
// with this month's count next to it is either true or a problem the founders
// need to see. So every commitment declares how it is measured, and the ones
// the app genuinely cannot prove say so rather than inventing a number.
//
// Romanian, with comma-below diacritics (ș ț) — these strings are printed and
// shown to residents.

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { APP_TZ } from "./dates";

export type CommitmentKey =
  | "sesizare_confirmata"
  | "bec_48h"
  | "deseuri_7z"
  | "deszapezire_7"
  | "defect_raportat"
  | "raport_5";

export interface Commitment {
  key: CommitmentKey;
  /** The promise, exactly as it is printed on the notice and in the offer. */
  textRo: string;
  /**
   * How the app checks it. `null` means the app holds no evidence either way,
   * and the page must show the promise with no score rather than a flattering
   * one. `deszapezire_7` is the honest example: we do not log snowfall.
   */
  measuredAsRo: string | null;
}

/** The seed list from §C4, in the order it is printed. */
export const COMMITMENTS: readonly Commitment[] = [
  {
    key: "sesizare_confirmata",
    textRo: "Sesizare primită și confirmată în 1 zi lucrătoare.",
    measuredAsRo: "Sesizări confirmate în 1 zi lucrătoare",
  },
  {
    key: "bec_48h",
    textRo:
      "Bec ars înlocuit în 48 de ore de la sesizare (24 de ore dacă zona e periculoasă).",
    measuredAsRo: "Becuri înlocuite în 48 de ore",
  },
  {
    key: "deseuri_7z",
    textRo: "Deșeuri voluminoase abandonate, evacuate în 7 zile.",
    measuredAsRo: "Deșeuri voluminoase evacuate în 7 zile",
  },
  {
    key: "deszapezire_7",
    textRo: "Deszăpezire la intrare înainte de ora 7:00.",
    // We do not record snowfall, and a visit log cannot tell the difference
    // between "cleared by 7:00" and "it did not snow". Claiming a score here
    // would be the kind of number this whole file exists to avoid.
    measuredAsRo: null,
  },
  {
    key: "defect_raportat",
    textRo:
      "Defecțiune observată, raportată administratorului în aceeași zi, cu fotografie.",
    // The "same day" half is structural — the report is written on the spot —
    // so what is worth counting is whether the photo was actually attached.
    measuredAsRo: "Defecțiuni raportate cu fotografie",
  },
  {
    key: "raport_5",
    textRo: "Raport lunar semnat, predat până în data de 5 a lunii următoare.",
    measuredAsRo: "Rapoarte lunare predate până în data de 5",
  },
] as const;

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** Issue fields the measurement needs. Keeps this module free of the DB. */
export interface MeasurableIssue {
  category: "bec" | "curatenie" | "deseuri" | "defectiune" | "zapada" | "altele";
  source: "tenant" | "cleaner" | "owner";
  createdAt: number;
  acknowledgedAt: number | null;
  resolvedAt: number | null;
  photoFileKey: string | null;
}

/** Protocol fields the measurement needs. */
export interface MeasurableProtocol {
  /** The month the report covers, "YYYY-MM". */
  month: string;
  generatedAt: number;
}

export interface CommitmentResult extends Commitment {
  /** How many cases the app could judge this month. */
  total: number;
  /** How many of those the commitment held for. */
  met: number;
  /** True when the app holds no evidence either way. */
  unmeasured: boolean;
}

/**
 * Advance `n` working days from `ts` and return the end of that day, in
 * Bucharest time. Saturdays and Sundays do not count.
 *
 * Legal holidays are deliberately *not* subtracted. Adding them would make
 * every deadline later and every score better, and a self-published number
 * should err against the publisher. A sceptical committee member checking this
 * by hand will find us early, never late.
 */
export function workingDayDeadline(ts: number, n: number): number {
  // Walk calendar days at noon UTC so a DST change cannot skip or repeat one,
  // then convert the final wall-clock instant back with the offset that
  // actually applies on that date.
  const cursor = new Date(`${formatInTimeZone(new Date(ts), APP_TZ, "yyyy-MM-dd")}T12:00:00Z`);
  let left = n;
  while (left > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  const ymd = cursor.toISOString().slice(0, 10);
  return fromZonedTime(`${ymd}T23:59:59.999`, APP_TZ).getTime();
}

/** Half-open month bounds `[from, to)` for "YYYY-MM", in Bucharest time. */
export function monthBounds(month: string): { from: number; to: number } {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return {
    from: fromZonedTime(`${month}-01T00:00:00`, APP_TZ).getTime(),
    to: fromZonedTime(`${next}-01T00:00:00`, APP_TZ).getTime(),
  };
}

function score(total: number, met: number, c: Commitment): CommitmentResult {
  return { ...c, total, met, unmeasured: c.measuredAsRo === null };
}

/**
 * Measure every commitment against one month of evidence.
 *
 * `issues` must already be scoped to the building and the month; `protocols`
 * to the building. A commitment with nothing to judge returns `total: 0`, and
 * the UI says "nicio sesizare luna aceasta" rather than a hollow 100%.
 */
export function measureCommitments(input: {
  month: string;
  issues: MeasurableIssue[];
  protocols: MeasurableProtocol[];
}): CommitmentResult[] {
  const { issues, protocols, month } = input;

  return COMMITMENTS.map((c) => {
    switch (c.key) {
      case "sesizare_confirmata": {
        // Every reported issue, whoever reported it, must be acknowledged.
        const judged = issues;
        const met = judged.filter(
          (i) =>
            i.acknowledgedAt !== null &&
            i.acknowledgedAt <= workingDayDeadline(i.createdAt, 1)
        ).length;
        return score(judged.length, met, c);
      }
      case "bec_48h": {
        // Only closed cases can be judged: an open one has not yet failed.
        const judged = issues.filter((i) => i.category === "bec" && i.resolvedAt !== null);
        const met = judged.filter((i) => i.resolvedAt! - i.createdAt <= 48 * HOUR).length;
        return score(judged.length, met, c);
      }
      case "deseuri_7z": {
        const judged = issues.filter(
          (i) => i.category === "deseuri" && i.resolvedAt !== null
        );
        const met = judged.filter((i) => i.resolvedAt! - i.createdAt <= 7 * DAY).length;
        return score(judged.length, met, c);
      }
      case "defect_raportat": {
        const judged = issues.filter(
          (i) => i.source === "cleaner" && i.category === "defectiune"
        );
        const met = judged.filter((i) => Boolean(i.photoFileKey)).length;
        return score(judged.length, met, c);
      }
      case "raport_5": {
        // The report for month M is due by the 5th of M+1.
        const judged = protocols.filter((p) => p.month <= month);
        const met = judged.filter((p) => {
          const [y, m] = p.month.split("-").map(Number) as [number, number];
          const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
          // "până în data de 5" includes the 5th, so the deadline is midnight
          // at the start of the 6th.
          return p.generatedAt < fromZonedTime(`${next}-06T00:00:00`, APP_TZ).getTime();
        }).length;
        return score(judged.length, met, c);
      }
      case "deszapezire_7":
      default:
        return score(0, 0, c);
    }
  });
}

/** "4 din 4" / "nicio sesizare luna aceasta" — never a hollow percentage. */
export function resultLineRo(r: CommitmentResult): string | null {
  if (r.unmeasured || !r.measuredAsRo) return null;
  if (r.total === 0) return `${r.measuredAsRo}: nu a fost cazul luna aceasta`;
  return `${r.measuredAsRo}: ${r.met} din ${r.total}`;
}
