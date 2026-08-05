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

/**
 * Which weekdays a building is visited, by visits-per-week. Monday-based
 * indices into weekDays(). Single source of truth: the visit generator books
 * these days and the posted schedule (add-on 2 §C1) prints them, so a resident
 * reading the wall sees the days that are actually in the diary.
 */
export const WEEK_PATTERNS: Record<number, number[]> = { 1: [0], 2: [0, 3], 3: [0, 2, 4] };

export const WEEKDAY_RO = [
  "luni",
  "marți",
  "miercuri",
  "joi",
  "vineri",
  "sâmbătă",
  "duminică",
];

/** "luni și joi" — the days line on the posted schedule. */
export function visitDaysRo(visitsPerWeek: number): string {
  const pattern = WEEK_PATTERNS[visitsPerWeek] ?? WEEK_PATTERNS[2]!;
  const names = pattern.map((i) => WEEKDAY_RO[i]!);
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(", ")} și ${names[names.length - 1]}`;
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
