// Dates: stored UTC, displayed in Europe/Bucharest (§3).
// Calendar-day strings (visit scheduling, months) are computed in the
// Bucharest zone so "today" means her today, not the server's.

import { formatInTimeZone } from "date-fns-tz";

export const APP_TZ = "Europe/Bucharest";

/** YYYY-MM-DD of "now" in Bucharest. */
export function todayYmd(now: Date = new Date()): string {
  return formatInTimeZone(now, APP_TZ, "yyyy-MM-dd");
}

/** YYYY-MM of "now" in Bucharest. */
export function currentMonthKey(now: Date = new Date()): string {
  return formatInTimeZone(now, APP_TZ, "yyyy-MM");
}

/** Human time in Bucharest for a stored UTC ms timestamp. */
export function fmtTime(ms: number): string {
  return formatInTimeZone(new Date(ms), APP_TZ, "HH:mm");
}

export function fmtDateTime(ms: number): string {
  return formatInTimeZone(new Date(ms), APP_TZ, "d MMM HH:mm");
}

/** Monday-based week (YYYY-MM-DD strings) containing the given Bucharest day. */
export function weekDays(ymd: string): string[] {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  const dow = (date.getUTCDay() + 6) % 7; // 0 = Monday
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    return day.toISOString().slice(0, 10);
  });
}

/** All YYYY-MM-DD days of a YYYY-MM month. */
export function monthDays(monthKey: string): string[] {
  const [y, m] = monthKey.split("-").map(Number);
  const days: string[] = [];
  const count = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  for (let d = 1; d <= count; d++) {
    days.push(`${monthKey}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

const RO_MONTHS = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
];

/** "iulie 2026" for the proces-verbal. */
export function monthNameRo(monthKey: string): { luna: string; an: string } {
  const [y, m] = monthKey.split("-");
  return { luna: RO_MONTHS[Number(m) - 1] ?? "", an: y ?? "" };
}
