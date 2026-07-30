import { describe, expect, it } from "vitest";
import {
  competitorPriceForFloors,
  defaultHoursForFloors,
  marketRateFor,
  priceOffer,
  suggestOpeningPrice,
} from "./offer";
import { PRICING } from "@/lib/constants";

describe("competitor ladder lookup", () => {
  it("returns published rungs exactly", () => {
    expect(competitorPriceForFloors(4)).toBe(400_00);
    expect(competitorPriceForFloors(10)).toBe(1200_00);
  });

  it("interpolates between rungs: 3 floors sits between 2 (250) and 4 (400)", () => {
    expect(competitorPriceForFloors(3)).toBe(325_00);
  });

  it("clamps outside the ladder", () => {
    expect(competitorPriceForFloors(1)).toBe(PRICING.COMPETITOR_LADDER[2]);
    expect(competitorPriceForFloors(20)).toBe(PRICING.COMPETITOR_LADDER[10]);
  });
});

describe("default hours scale from the measured 3-floor block", () => {
  it("3 floors reproduces the founders' measured 1.5 h", () => {
    expect(defaultHoursForFloors(3)).toBe(1.5);
  });

  it("scales with floors and never drops below an hour", () => {
    expect(defaultHoursForFloors(8)).toBe(4);
    expect(defaultHoursForFloors(1)).toBe(1);
  });
});

describe("offer pricing", () => {
  const fantanii = {
    floors: 3,
    apartments: 11,
    residents: 24,
    visitsPerWeek: 2,
    hoursPerVisit: 1.5,
  };

  it("prices the Fântânii contract and shows the tenant's-eye view", () => {
    const p = priceOffer({ ...fantanii, priceBani: 3566_00 });
    expect(p.costFloorBani).toBe(51525); // matches the core unit economics
    expect(p.perApartmentBani).toBe(32418); // 3,566 / 11
    expect(p.perPersonBani).toBe(14858); // 3,566 / 24 = 148.58 lei ≈ EUR 28.3
    expect(p.marginPct).toBeCloseTo(0.8555, 3);
  });

  it("flags the captive-landlord price as fragile in a competitive pitch", () => {
    const p = priceOffer({ ...fantanii, priceBani: 3566_00 });
    // 3,566 against the researched 700 lei market rate is ~5.1x (spec §2).
    expect(p.marketRateBani).toBe(700_00);
    expect(p.multipleOfMarket).toBeCloseTo(5.09, 1);
    expect(p.warnings.map((w) => w.kind)).toContain("fragile_vs_market");
  });

  it("surfaces that the published ladder undercuts our own direct cost", () => {
    const p = priceOffer({ ...fantanii, priceBani: 800_00 });
    // Ladder interpolates to 325 for 3 floors; direct cost is 515.25.
    expect(p.competitorLadderBani).toBe(325_00);
    expect(p.ladderBelowCost).toBe(true);
  });

  it("scales the market rate by floors and frequency", () => {
    expect(marketRateFor(3, 2)).toBe(700_00);
    expect(marketRateFor(6, 2)).toBe(1400_00);
    expect(marketRateFor(3, 1)).toBe(350_00);
  });

  it("flags a price below direct cost", () => {
    const p = priceOffer({ ...fantanii, priceBani: 400_00 });
    expect(p.warnings.map((w) => w.kind)).toContain("below_cost");
  });

  it("flags a thin margin between cost and the recommended floor", () => {
    const p = priceOffer({ ...fantanii, priceBani: 600_00 });
    const kinds = p.warnings.map((w) => w.kind);
    expect(kinds).toContain("thin_margin");
    expect(kinds).not.toContain("below_cost");
  });

  it("a market-rate quote for a 3-floor block is clean of warnings", () => {
    // Recommended floor: max(1.5 x 515.25, 325) = 772.88
    const p = priceOffer({ ...fantanii, priceBani: 800_00 });
    expect(p.warnings).toEqual([]);
    expect(p.marginBani).toBe(800_00 - p.costFloorBani);
  });

  it("recommended floor never sits under 1.5x direct cost", () => {
    const p = priceOffer({ ...fantanii, priceBani: 800_00 });
    expect(p.recommendedMinBani).toBeGreaterThanOrEqual(
      Math.round(p.costFloorBani * 1.5)
    );
  });
});

describe("opening price suggestion", () => {
  it("suggests a defensible opening number for a fresh 3-floor prospect", () => {
    const price = suggestOpeningPrice(3);
    const p = priceOffer({
      floors: 3,
      apartments: 11,
      residents: 24,
      visitsPerWeek: 2,
      hoursPerVisit: defaultHoursForFloors(3),
      priceBani: price,
    });
    expect(p.warnings).toEqual([]);
    expect(price).toBeGreaterThan(p.costFloorBani);
  });

  it("rises with floor count", () => {
    expect(suggestOpeningPrice(8)).toBeGreaterThan(suggestOpeningPrice(3));
  });
});
