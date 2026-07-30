// Offer (ofertă) pricing — the sales brain. Pure, no I/O, money in bani.
//
// Why this exists: the founders' 3,566 lei price is what a captive landlord
// pays (7.2x market). Carrying that number into a competitive pitch to an
// asociație de proprietari loses the deal against a competitor's published
// price list. This module prices a specific building honestly: the cost floor
// it must never go under, the published competitor rate for that floor count,
// and the guardrails from §6 of the spec.

import { PRICING, SERVICE } from "@/lib/constants";
import { buildingUnitEconomics } from "./core";

export interface OfferInput {
  floors: number;
  apartments: number;
  /** Residents; used for the per-person view that tenants actually feel. */
  residents: number;
  visitsPerWeek: number;
  hoursPerVisit: number;
  /** The price being quoted. */
  priceBani: number;
}

export interface OfferPricing {
  hoursPerMonth: number;
  costFloorBani: number;
  /**
   * Like-for-like market rate for THIS building: the spec's researched
   * 700 lei for a 3-floor block cleaned twice a week, scaled by floors and
   * frequency. This is the honest comparator for a competitive pitch.
   */
  marketRateBani: number;
  /**
   * Published competitor rate for this floor count (interpolated ladder).
   * Context only: those list prices are almost certainly for a lighter
   * frequency, which is why they can sit under our cost.
   */
  competitorLadderBani: number;
  /**
   * True when the published ladder rate is below our direct cost. Not a fault
   * in the quote: it means that price cannot be served twice a week on
   * declared wages, which is the whole competitive story.
   */
  ladderBelowCost: boolean;
  /** What the founders charge on the Fântânii contract, as a reference point. */
  currentContractBani: number;
  recommendedMinBani: number;
  recommendedMaxBani: number;
  marginBani: number;
  /** 0..1 */
  marginPct: number;
  multipleOfMarket: number;
  perApartmentBani: number;
  perPersonBani: number;
  warnings: OfferWarning[];
}

export type OfferWarning =
  | { kind: "below_cost"; message: string }
  | { kind: "thin_margin"; message: string }
  | { kind: "fragile_vs_market"; message: string };

/**
 * Like-for-like market rate: PRICING.MARKET_PRICE_3FLOOR_2X is researched for
 * a 3-floor block cleaned twice weekly, so scale linearly on both axes.
 */
export function marketRateFor(floors: number, visitsPerWeek: number): number {
  const scale = (floors / 3) * (visitsPerWeek / 2);
  return Math.round(PRICING.MARKET_PRICE_3FLOOR_2X * scale);
}

/**
 * Published competitor ladder (Curățenie Florin SRL, live 2026) is sparse by
 * floor count. Interpolate between the two nearest rungs; clamp at the ends.
 */
export function competitorPriceForFloors(floors: number): number {
  const ladder = PRICING.COMPETITOR_LADDER;
  const rungs = Object.keys(ladder)
    .map(Number)
    .sort((a, b) => a - b);
  const first = rungs[0]!;
  const last = rungs[rungs.length - 1]!;
  if (floors <= first) return ladder[first]!;
  if (floors >= last) return ladder[last]!;
  if (ladder[floors] !== undefined) return ladder[floors]!;

  let lower = first;
  let upper = last;
  for (const r of rungs) {
    if (r <= floors) lower = r;
    if (r >= floors) {
      upper = r;
      break;
    }
  }
  const span = upper - lower;
  if (span === 0) return ladder[lower]!;
  const t = (floors - lower) / span;
  return Math.round(ladder[lower]! + t * (ladder[upper]! - ladder[lower]!));
}

/**
 * Default cleaning time for a block, derived from the founders' measured
 * 1.5 h for a 3-floor block (§4): 0.5 h per floor, floored at one hour.
 */
export function defaultHoursForFloors(floors: number): number {
  return Math.max(1, Math.round(floors * 0.5 * 4) / 4);
}

export function priceOffer(input: OfferInput): OfferPricing {
  const unit = buildingUnitEconomics({
    priceBani: input.priceBani,
    hoursPerVisit: input.hoursPerVisit,
    visitsPerWeek: input.visitsPerWeek,
  });

  const ladder = competitorPriceForFloors(input.floors);
  const market = marketRateFor(input.floors, input.visitsPerWeek);
  const currentContract = PRICING.TARGET_PRICE_PER_BUILDING;

  // Never quote under 1.5x direct cost: overhead and dead time still have to
  // be covered before this building contributes anything.
  const recommendedMin = Math.round(unit.directBani * 1.5);
  const recommendedMax = Math.max(recommendedMin, currentContract);

  const warnings: OfferWarning[] = [];
  if (input.priceBani < unit.directBani) {
    warnings.push({
      kind: "below_cost",
      message:
        "This price is below the direct cost of running the building. Every visit loses money.",
    });
  } else if (input.priceBani < recommendedMin) {
    warnings.push({
      kind: "thin_margin",
      message:
        "Above cost, but under the recommended floor once overhead and dead time are counted.",
    });
  }
  // §6 guardrail, measured against the like-for-like market rate.
  if (market > 0 && input.priceBani > market * 2) {
    warnings.push({
      kind: "fragile_vs_market",
      message:
        "More than 2x the market rate for this building. That holds with a captive landlord, not in a competitive pitch to an association.",
    });
  }

  return {
    hoursPerMonth: unit.hoursPerMonth,
    costFloorBani: unit.directBani,
    marketRateBani: market,
    competitorLadderBani: ladder,
    ladderBelowCost: ladder < unit.directBani,
    currentContractBani: currentContract,
    recommendedMinBani: recommendedMin,
    recommendedMaxBani: recommendedMax,
    marginBani: unit.marginBani,
    marginPct: unit.marginPct,
    multipleOfMarket: market > 0 ? input.priceBani / market : 0,
    perApartmentBani:
      input.apartments > 0 ? Math.round(input.priceBani / input.apartments) : 0,
    perPersonBani: input.residents > 0 ? Math.round(input.priceBani / input.residents) : 0,
    warnings,
  };
}

/**
 * Sensible starting point for a fresh prospect: the cost-driven floor, or the
 * market rate when that is higher (no reason to undercut a market that already
 * pays more than our floor).
 */
export function suggestOpeningPrice(
  floors: number,
  visitsPerWeek: number = SERVICE.DEFAULT_VISITS_PER_WEEK
): number {
  const hours = defaultHoursForFloors(floors);
  const unit = buildingUnitEconomics({
    priceBani: 0,
    hoursPerVisit: hours,
    visitsPerWeek,
  });
  return Math.max(Math.round(unit.directBani * 1.5), marketRateFor(floors, visitsPerWeek));
}
