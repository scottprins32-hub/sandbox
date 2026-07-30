// VAT "crossing the wall" helpers (§6, VAT-registered toggle).
// Two sub-strategies once registered:
//  (a) reprice — clients pay price × 1.21; net revenue per building unchanged.
//      Fragile: residential clients cannot reclaim VAT, so their cost rises 21%.
//  (b) absorb — client price unchanged; net revenue = price ÷ 1.21; margin takes the hit.

import { TAX } from "@/lib/constants";

export interface VatStrategyNumbers {
  /** What the client is invoiced per building, VAT included. */
  clientPriceBani: number;
  /** Revenue the company keeps per building, net of VAT. */
  netRevenuePerBuildingBani: number;
}

export function vatReprice(priceBani: number): VatStrategyNumbers {
  return {
    clientPriceBani: Math.round(priceBani * (1 + TAX.VAT_RATE)),
    netRevenuePerBuildingBani: priceBani,
  };
}

export function vatAbsorb(priceBani: number): VatStrategyNumbers {
  return {
    clientPriceBani: priceBani,
    netRevenuePerBuildingBani: Math.round(priceBani / (1 + TAX.VAT_RATE)),
  };
}

export type VatGaugeState = "green" | "amber" | "red";

/** Gauge semantics shared by Simulator and Ops Money tab (§6, §7.2). */
export function vatGauge(annualRunRateBani: number): {
  state: VatGaugeState;
  /** 0..1 of the threshold used. */
  used: number;
  headroomBani: number;
} {
  const used = annualRunRateBani / TAX.VAT_THRESHOLD_ANNUAL;
  const headroom = TAX.VAT_THRESHOLD_ANNUAL - annualRunRateBani;
  const state: VatGaugeState = used >= 1 ? "red" : used > 0.8 ? "amber" : "green";
  return { state, used, headroomBani: headroom };
}
