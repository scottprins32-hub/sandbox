// Display helpers. Storage/computation is bani (integer lei-cents); conversion
// to lei/EUR happens only here, at display time (§3).

import { FX } from "@/lib/constants";

const leiFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const leiFmt2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "3,566" (whole lei) or "515.25" when bani matter. */
export function fmtLei(bani: number): string {
  const lei = bani / 100;
  return Number.isInteger(lei) ? leiFmt.format(lei) : leiFmt2.format(lei);
}

/** Rounded to whole lei: "3,566". */
export function fmtLeiRound(bani: number): string {
  return leiFmt.format(Math.round(bani / 100));
}

export function baniToEur(bani: number, ronPerEur: number = FX.RON_PER_EUR): number {
  return bani / 100 / ronPerEur;
}

export function fmtEur(bani: number, ronPerEur: number = FX.RON_PER_EUR): string {
  return `€${leiFmt.format(Math.round(baniToEur(bani, ronPerEur)))}`;
}

export function eurToBani(eur: number, ronPerEur: number = FX.RON_PER_EUR): number {
  return Math.round(eur * ronPerEur * 100);
}
