// §5.2 test fixtures — must pass exactly (±1 ban rounding).
// One deviation, logged in DECISIONS.md: the spec's fixture table shows labour
// 420.33 / direct 515.33 / margin 3,050.67, but those values cannot be derived
// from the §4 constants (13.0 h × 4,418/166.667/0.82 = 420.2479 → 420.25).
// Constants are the source of truth (§1.6), so the derived values are asserted.

import { describe, expect, it } from "vitest";
import {
  buildingUnitEconomics,
  cleanerCapacityBuildings,
  costPerProductiveHourBani,
  hoursPerBuildingMonth,
  microCeilingBuildings,
  vatCeilingBuildings,
  visitsPerMonth,
} from "./core";
import { employerCost } from "./payroll";
import { DEFAULT_RAMP_24MO, project } from "./projection";
import { vatAbsorb, vatGauge, vatReprice } from "./vat";
import { OVERHEAD_TOTAL_MONTHLY, PRICING } from "@/lib/constants";
import { baniToEur } from "@/lib/money";

const PRICE = PRICING.TARGET_PRICE_PER_BUILDING; // 3,566.00 lei

describe("core derivations (§5.1)", () => {
  it("visits per month: 2/wk → 8.667", () => {
    expect(visitsPerMonth(2)).toBeCloseTo(8.667, 3);
  });

  it("hours per building-month: 1.5h × 2/wk → 13.00", () => {
    expect(hoursPerBuildingMonth(1.5, 2)).toBeCloseTo(13.0, 2);
  });

  it("cost per productive hour → 32.33 lei", () => {
    expect(costPerProductiveHourBani() / 100).toBeCloseTo(32.33, 2);
  });

  it("building @2x/wk 1.5h, price 3,566: labour/direct/margin (derived from constants)", () => {
    const ue = buildingUnitEconomics({ priceBani: PRICE, hoursPerVisit: 1.5, visitsPerWeek: 2 });
    expect(ue.hoursPerMonth).toBeCloseTo(13.0, 2);
    // Spec fixture table: 420.33 / 515.33 / 3,050.67 (85.6%) — see header note.
    expect(ue.labourBani).toBe(42025);
    expect(ue.directBani).toBe(51525);
    expect(ue.marginBani).toBe(305075);
    expect(ue.marginPct).toBeCloseTo(0.8555, 3);
  });

  it("capacity: 10.51 buildings per full-time cleaner", () => {
    expect(cleanerCapacityBuildings(1.5, 2)).toBeCloseTo(10.51, 2);
  });

  it("VAT ceiling at 3,566 → 9.23 buildings", () => {
    expect(vatCeilingBuildings(PRICE)).toBeCloseTo(9.23, 2);
  });

  it("micro ceiling at 3,566 → 11.9 buildings", () => {
    expect(microCeilingBuildings(PRICE)).toBeCloseTo(11.9, 1);
  });
});

describe("payroll models (§5.2)", () => {
  it("full-time min wage: employer 4,418.00, net 2,699.00", () => {
    const bd = employerCost("fulltime_min", 8);
    expect(bd.employerTotalBani).toBe(4418_00);
    expect(bd.netBani).toBe(2699_00);
  });

  it("student 2h/day, gross 1,100: CAS 275, CASS 110, tax 0, net 715, employer 1,124.75", () => {
    const bd = employerCost("parttime_student", 2, 1100_00);
    expect(bd.employeeCasBani).toBe(275_00);
    expect(bd.employeeCassBani).toBe(110_00);
    expect(bd.incomeTaxBani).toBe(0);
    expect(bd.netBani).toBe(715_00);
    expect(bd.employerCamBani).toBe(24_75);
    expect(bd.floorTopUpBani).toBe(0);
    expect(bd.employerTotalBani).toBe(1124_75);
  });

  it("non-exempt 2h/day, gross 1,100: net 715, floor top-up 1,128.75, employer 2,253.50", () => {
    const bd = employerCost("parttime_standard", 2, 1100_00);
    expect(bd.netBani).toBe(715_00);
    expect(bd.floorTopUpBani).toBe(1128_75);
    expect(bd.employerTotalBani).toBe(2253_50);
  });

  it("pensioner: exempt from the floor, no student deduction", () => {
    const bd = employerCost("parttime_pensioner", 2, 1100_00);
    expect(bd.floorTopUpBani).toBe(0);
    expect(bd.netBani).toBe(715_00);
    expect(bd.employerTotalBani).toBe(1124_75);
  });
});

describe("four-building P&L (§5.2 fixture)", () => {
  it("revenue 14,264; cost 6,010.64; profit 8,253.36 ≈ €1,574/mo", () => {
    const [row] = project(1, {
      pricePerBuildingBani: PRICE,
      buildingsByMonth: [4],
      hoursPerVisit: 1.5,
      visitsPerWeek: 2,
      wageMix: { fulltimeCount: 1, flex: [] },
      overheadBani: OVERHEAD_TOTAL_MONTHLY,
    });
    expect(row).toBeDefined();
    expect(row!.revenueBani).toBe(14264_00);
    expect(row!.payrollBani).toBe(4418_00);
    expect(row!.consumablesBani + row!.travelBani).toBe(380_00);
    expect(row!.taxBani).toBe(142_64);
    expect(row!.totalCostBani).toBe(6010_64);
    expect(row!.profitBani).toBe(8253_36);
    expect(baniToEur(row!.profitBani)).toBeCloseTo(1574, 0);
  });
});

describe("projection engine (§5.3)", () => {
  it("default ramp: VAT flag fires at month 5 (10 buildings) at price 3,566", () => {
    const rows = project(24, {
      pricePerBuildingBani: PRICE,
      buildingsByMonth: DEFAULT_RAMP_24MO,
      hoursPerVisit: 1.5,
      visitsPerWeek: 2,
      wageMix: { fulltimeCount: 1, flex: [] },
      overheadBani: OVERHEAD_TOTAL_MONTHLY,
    });
    const firstBreach = rows.findIndex((r) => r.vatBreached);
    // Month index 5 (the 6th month) has 10 buildings → 427,920 lei/yr > 395,000.
    expect(firstBreach).toBe(5);
    expect(rows[4]!.vatBreached).toBe(false); // 8 buildings → 342,336
  });

  it("cleaners increment with hours; cumulative cash seeded with −7,100", () => {
    const rows = project(3, {
      pricePerBuildingBani: PRICE,
      buildingsByMonth: [4, 11, 22],
      hoursPerVisit: 1.5,
      visitsPerWeek: 2,
      wageMix: { fulltimeCount: 1, flex: [] },
      overheadBani: OVERHEAD_TOTAL_MONTHLY,
    });
    expect(rows[0]!.cleanersNeeded).toBe(1); // 52 h
    expect(rows[1]!.cleanersNeeded).toBe(2); // 143 h > 136.667
    expect(rows[2]!.cleanersNeeded).toBe(3); // 286 h
    expect(rows[0]!.cumulativeCashBani).toBe(rows[0]!.profitBani - 7100_00);
  });

  it("micro→16% switch past the ceiling", () => {
    const rows = project(1, {
      pricePerBuildingBani: PRICE,
      buildingsByMonth: [20], // 855,840 lei/yr — past both walls
      hoursPerVisit: 1.5,
      visitsPerWeek: 2,
      wageMix: { fulltimeCount: 2, flex: [] },
      overheadBani: OVERHEAD_TOTAL_MONTHLY,
    });
    const row = rows[0]!;
    expect(row.microBreached).toBe(true);
    const costBeforeTax =
      row.payrollBani + row.consumablesBani + row.travelBani + row.overheadBani;
    expect(row.taxBani).toBe(Math.round((row.revenueBani - costBeforeTax) * 0.16));
  });

  it("turnovers add revenue, hours and consumables", () => {
    const withTurnovers = project(1, {
      pricePerBuildingBani: PRICE,
      buildingsByMonth: [4],
      hoursPerVisit: 1.5,
      visitsPerWeek: 2,
      wageMix: { fulltimeCount: 1, flex: [] },
      overheadBani: OVERHEAD_TOTAL_MONTHLY,
      turnovers: { perWeek: 6, priceBani: 150_00 },
    })[0]!;
    const jobs = (6 * 52) / 12; // 26/mo
    expect(withTurnovers.turnoverRevenueBani).toBe(Math.round(jobs * 150_00));
    expect(withTurnovers.totalHours).toBeCloseTo(4 * 13 + jobs * 2, 5);
  });
});

describe("VAT strategies and gauge (§6)", () => {
  it("reprice: client pays ×1.21, net unchanged", () => {
    const s = vatReprice(PRICE);
    expect(s.clientPriceBani).toBe(Math.round(3566_00 * 1.21)); // 4,314.86
    expect(s.netRevenuePerBuildingBani).toBe(PRICE);
  });

  it("absorb: client price unchanged, net ÷1.21", () => {
    const s = vatAbsorb(PRICE);
    expect(s.clientPriceBani).toBe(PRICE);
    expect(s.netRevenuePerBuildingBani).toBe(Math.round(3566_00 / 1.21)); // 2,947.11
  });

  it("gauge: green >20% headroom, amber <20%, red breached", () => {
    expect(vatGauge(300000_00).state).toBe("green"); // 76% used
    expect(vatGauge(330000_00).state).toBe("amber"); // 83.5% used
    expect(vatGauge(400000_00).state).toBe("red");
  });
});
