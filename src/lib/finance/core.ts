// Core unit-economics derivations (§5.1). Pure functions, no I/O.
// Money in bani; hours/ratios as floats; rounding only at struct boundaries.

import { LABOUR, SERVICE, TAX } from "@/lib/constants";

export function visitsPerMonth(visitsPerWeek: number): number {
  return (visitsPerWeek * 52) / 12;
}

export function hoursPerBuildingMonth(
  hoursPerVisit: number,
  visitsPerWeek: number
): number {
  return hoursPerVisit * visitsPerMonth(visitsPerWeek);
}

/** Employer cost of one productive hour, in bani (float). ≈ 3,232.68 bani = 32.33 lei. */
export function costPerProductiveHourBani(): number {
  return (
    LABOUR.EMPLOYER_COST_FULLTIME /
    LABOUR.STATUTORY_HOURS_PER_MONTH /
    LABOUR.PRODUCTIVE_SHARE
  );
}

/** Productive hours one full-time cleaner delivers per month. ≈ 136.667 h. */
export function productiveHoursPerFulltime(): number {
  return LABOUR.STATUTORY_HOURS_PER_MONTH * LABOUR.PRODUCTIVE_SHARE;
}

export interface UnitEconomics {
  hoursPerMonth: number;
  labourBani: number;
  consumablesBani: number;
  travelBani: number;
  directBani: number;
  marginBani: number;
  /** 0..1 */
  marginPct: number;
}

export function buildingUnitEconomics(input: {
  priceBani: number;
  hoursPerVisit: number;
  visitsPerWeek: number;
  consumablesBani?: number;
  travelBani?: number;
}): UnitEconomics {
  const hours = hoursPerBuildingMonth(input.hoursPerVisit, input.visitsPerWeek);
  const labour = Math.round(hours * costPerProductiveHourBani());
  const consumables = input.consumablesBani ?? SERVICE.CONSUMABLES_PER_BUILDING_MONTH;
  const travel = input.travelBani ?? SERVICE.TRAVEL_PER_BUILDING_MONTH;
  const direct = labour + consumables + travel;
  const margin = input.priceBani - direct;
  return {
    hoursPerMonth: hours,
    labourBani: labour,
    consumablesBani: consumables,
    travelBani: travel,
    directBani: direct,
    marginBani: margin,
    marginPct: input.priceBani > 0 ? margin / input.priceBani : 0,
  };
}

/** Buildings one full-time cleaner can carry at these settings. ≈ 10.51 at defaults. */
export function cleanerCapacityBuildings(
  hoursPerVisit: number,
  visitsPerWeek: number
): number {
  return productiveHoursPerFulltime() / hoursPerBuildingMonth(hoursPerVisit, visitsPerWeek);
}

/** Buildings runnable before the VAT threshold. ≈ 9.23 at 3,566 lei. */
export function vatCeilingBuildings(priceBani: number): number {
  return TAX.VAT_THRESHOLD_ANNUAL / (priceBani * 12);
}

/** Buildings runnable before the micro-enterprise ceiling. ≈ 11.9 at 3,566 lei. */
export function microCeilingBuildings(priceBani: number): number {
  return TAX.MICRO_CEILING_ANNUAL / (priceBani * 12);
}

/** Buildings needed to cover overhead plus one full-time cleaner. */
export function breakEvenBuildings(
  priceBani: number,
  overheadBani: number,
  opts?: { hoursPerVisit?: number; visitsPerWeek?: number }
): number {
  const ue = buildingUnitEconomics({
    priceBani,
    hoursPerVisit: opts?.hoursPerVisit ?? SERVICE.DEFAULT_HOURS_PER_VISIT,
    visitsPerWeek: opts?.visitsPerWeek ?? SERVICE.DEFAULT_VISITS_PER_WEEK,
  });
  if (ue.marginBani <= 0) return Infinity;
  return (overheadBani + LABOUR.EMPLOYER_COST_FULLTIME) / ue.marginBani;
}
