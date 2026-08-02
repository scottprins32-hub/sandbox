// Derived helpers over the obligations catalogue (add-on §3).
// Pure functions. Calendar dates are YYYY-MM-DD strings evaluated against
// Europe/Bucharest "today" (see lib/dates); date arithmetic itself is calendar
// arithmetic, so it is timezone-independent by construction.

import { todayYmd } from "@/lib/dates";
import { OBLIGATIONS } from "./catalogue";
import type {
  BuildingFlags,
  Cadence,
  Obligation,
  ObligationStatus,
} from "./types";

const DUE_SOON_DAYS = 30;

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y: y ?? 1970, m: m ?? 1, d: d ?? 1 };
}

function toYmd(y: number, m: number, d: number): string {
  // Normalise via UTC so month overflow (e.g. month 13) rolls correctly, and
  // clamp day-of-month so 31 Jan + 1 month lands on 28/29 Feb rather than 3 Mar.
  const lastDayOfTarget = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const day = Math.min(d, lastDayOfTarget);
  const date = new Date(Date.UTC(y, m - 1, day));
  return date.toISOString().slice(0, 10);
}

export function addMonthsYmd(ymd: string, months: number): string {
  const { y, m, d } = parseYmd(ymd);
  const total = (y * 12 + (m - 1)) + months;
  return toYmd(Math.floor(total / 12), (total % 12) + 1, d);
}

export function addYearsYmd(ymd: string, years: number): string {
  return addMonthsYmd(ymd, years * 12);
}

export function daysBetweenYmd(from: string, to: string): number {
  const a = parseYmd(from);
  const b = parseYmd(to);
  const ms =
    Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d);
  return Math.round(ms / 86_400_000);
}

/** Months between recurrences, or null for cadences with no fixed interval. */
export function intervalMonths(cadence: Cadence): number | null {
  switch (cadence.kind) {
    case "fixed":
      return cadence.perYear > 0 ? 12 / cadence.perYear : null;
    case "months":
      return cadence.every;
    case "years":
      return cadence.every * 12;
    default:
      return null;
  }
}

/**
 * Next due date for an obligation given when it was last done.
 * Returns null for cadences that have no due date (continuous, event) and for
 * interval cadences that have never been performed (nothing to count from).
 */
export function nextDueDate(
  obligation: Obligation,
  lastDoneDate: string | null,
  now: string = todayYmd()
): string | null {
  const c = obligation.cadence;

  if (c.kind === "continuous" || c.kind === "event") return null;

  if (c.kind === "once") return c.byDate;

  if (c.kind === "seasonal") {
    // Due at the start of the next season window that has not yet been served.
    const { y, m } = parseYmd(now);
    const startThisYear = toYmd(y, c.fromMonth, 1);
    if (lastDoneDate && lastDoneDate >= startThisYear) {
      return toYmd(y + 1, c.fromMonth, 1);
    }
    return m <= c.toMonth ? startThisYear : toYmd(y + 1, c.fromMonth, 1);
  }

  const months = intervalMonths(c);
  if (months === null) return null;
  if (!lastDoneDate) return null; // never performed: no anchor to count from
  // Fractional months only arise from `fixed` cadences (12/perYear); round to
  // whole months so due dates land on real calendar days.
  return addMonthsYmd(lastDoneDate, Math.round(months));
}

/** 'ok' | 'due_soon' (within 30 days) | 'overdue' | 'unknown'. */
export function statusOf(
  obligation: Obligation,
  lastDoneDate: string | null,
  now: string = todayYmd()
): ObligationStatus {
  const c = obligation.cadence;

  // State-based obligations: nothing is "due", but an unrecorded one is unknown.
  if (c.kind === "continuous" || c.kind === "event") {
    return lastDoneDate ? "ok" : "unknown";
  }

  const due = nextDueDate(obligation, lastDoneDate, now);
  if (due === null) return "unknown"; // interval cadence, never performed

  if (c.kind === "once" && lastDoneDate) return "ok";

  const days = daysBetweenYmd(now, due);
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "due_soon";
  return "ok";
}

/** Filters the catalogue by a building's flags via `appliesIf`. */
export function applicableObligations(
  building: BuildingFlags,
  catalogue: Obligation[] = OBLIGATIONS
): Obligation[] {
  return catalogue.filter((o) => {
    switch (o.appliesIf) {
      case "has_lift":
        return building.hasLift === true;
      case "has_gas":
        return building.hasGas === true;
      case "has_playground":
        return building.hasPlayground === true;
      case "has_basement":
        return building.hasBasement === true;
      case "always":
      case undefined:
        return true;
    }
  });
}

export interface ExposureInput {
  obligation: Obligation;
  lastDoneDate: string | null;
}

/**
 * Maximum statutory exposure across obligations that are overdue or never
 * recorded. This is a sum of legal maximums for reference, never a prediction
 * (add-on §2.6).
 */
export function maxExposureBani(
  entries: ExposureInput[],
  now: string = todayYmd()
): number {
  return entries.reduce((sum, e) => {
    const status = statusOf(e.obligation, e.lastDoneDate, now);
    if (status !== "overdue" && status !== "unknown") return sum;
    return sum + (e.obligation.fineMaxBani ?? 0);
  }, 0);
}

/**
 * The largest uncovered exposures by name, for the exposure widget.
 * Deduplicated by obligation: across several buildings the same obligation
 * would otherwise fill the list with repeats of one name. `buildings` says how
 * many uncovered instances share that figure.
 */
export function largestExposures(
  entries: ExposureInput[],
  count = 2,
  now: string = todayYmd()
): { obligation: Obligation; fineMaxBani: number; buildings: number }[] {
  const byKey = new Map<string, { obligation: Obligation; fineMaxBani: number; buildings: number }>();
  for (const e of entries) {
    const s = statusOf(e.obligation, e.lastDoneDate, now);
    if (s !== "overdue" && s !== "unknown") continue;
    if ((e.obligation.fineMaxBani ?? 0) <= 0) continue;
    const found = byKey.get(e.obligation.key);
    if (found) found.buildings += 1;
    else
      byKey.set(e.obligation.key, {
        obligation: e.obligation,
        fineMaxBani: e.obligation.fineMaxBani!,
        buildings: 1,
      });
  }
  return [...byKey.values()]
    .sort((a, b) => b.fineMaxBani - a.fineMaxBani)
    .slice(0, count);
}

/** Sort key for the calendar: most urgent first. */
export const STATUS_ORDER: Record<ObligationStatus, number> = {
  overdue: 0,
  due_soon: 1,
  unknown: 2,
  ok: 3,
};
