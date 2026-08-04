// Simulator scenario state: types, defaults, persistence, derived results.
// All computation delegates to src/lib/finance — this file only wires state.

import {
  FX,
  LABOUR,
  OVERHEAD_TOTAL_MONTHLY,
  PRICING,
  SERVICE,
  TARGETS,
} from "@/lib/constants";
import { SERVICE_LINE_BY_KEY } from "@/lib/compliance/services";
import {
  buildingUnitEconomics,
  cleanerCapacityBuildings,
  employerCost,
  microCeilingBuildings,
  project,
  vatCeilingBuildings,
  wageMixMonthlyCost,
  wageMixProductiveHours,
  type FlexRow,
  type MonthRow,
  type ProjectionPlan,
  type UnitEconomics,
} from "@/lib/finance";

export type CityPreset = "giroc" | "dumbravita" | "custom";
export type VatStrategy = "reprice" | "absorb";

// Attachable compliance lines (add-on §7): recurring per-building services a
// fraction of buildings buy on top of core cleaning. Attach rate is that
// fraction. Per-apartment and per-job lines are excluded — their monthly value
// depends on data the Simulator does not model.
export const ATTACHABLE_LINES = [
  "tur_control",
  "calendar_conformitate",
  "spatiu_verde",
] as const;
export type AttachableLine = (typeof ATTACHABLE_LINES)[number];
export type AttachRates = Record<AttachableLine, number>; // percent, 0-100

export interface SimState {
  priceBani: number;
  buildings: number;
  growthPerMonth: number;
  hoursPerVisit: number;
  visitsPerWeek: 1 | 2 | 3;
  fulltimeCount: number;
  flex: FlexRow[];
  turnoversPerWeek: number;
  turnoverPriceBani: number;
  overheadBani: number;
  platformFeeBani: number;
  ronPerEur: number;
  partTimeFloorBani: number;
  vatRegistered: boolean;
  vatStrategy: VatStrategy;
  preset: CityPreset;
  attach: AttachRates;
}

// Defaults per §6: the locked "permanent core + student bench" strategy.
export const DEFAULT_STATE: SimState = {
  priceBani: PRICING.TARGET_PRICE_PER_BUILDING,
  buildings: 4,
  growthPerMonth: 2,
  hoursPerVisit: SERVICE.DEFAULT_HOURS_PER_VISIT,
  visitsPerWeek: 2,
  fulltimeCount: 1,
  flex: [{ model: "parttime_student", count: 1, hoursPerDay: 4 }],
  turnoversPerWeek: 0,
  turnoverPriceBani: SERVICE.TURNOVER.DEFAULT_PRICE,
  overheadBani: OVERHEAD_TOTAL_MONTHLY,
  platformFeeBani: TARGETS.PLATFORM_FEE_MONTHLY_DEFAULT,
  ronPerEur: FX.RON_PER_EUR,
  partTimeFloorBani: LABOUR.PART_TIME_FLOOR_MONTHLY,
  vatRegistered: false,
  vatStrategy: "reprice",
  preset: "giroc",
  attach: { tur_control: 0, calendar_conformitate: 0, spatiu_verde: 0 },
};

export const CURRENT_KEY = "scara.sim.current";
export const PINNED_KEY = "scara.sim.pinnedA";

export function loadState(key: string): SimState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SimState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      attach: { ...DEFAULT_STATE.attach, ...(parsed.attach ?? {}) },
    };
  } catch {
    return null;
  }
}

export function saveState(key: string, state: SimState | null) {
  if (typeof window === "undefined") return;
  if (state === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, JSON.stringify(state));
}

export interface SimResults {
  unit: UnitEconomics;
  rows: MonthRow[]; // 24 months
  now: MonthRow; // month 0
  at12: MonthRow;
  capacityBuildings: number;
  vatCeiling: number;
  /** VAT ceiling if the buildings bought only core cleaning. */
  vatCeilingCoreOnly: number;
  microCeiling: number;
  /** Month index where profit first crosses the €2,000 target, or -1. */
  worthItMonth: number;
  worthItLineBani: number;
  dividendNetBani: number;
  blendedCostPerHourBani: number | null;
  /** Attach-rate-weighted service revenue per building (add-on §7). */
  extraPerBuildingBani: number;
  blendedPriceBani: number;
}

/** Attach-rate-weighted average service revenue per building, in bani. */
export function attachExtraPerBuildingBani(attach: AttachRates): number {
  let extra = 0;
  for (const key of ATTACHABLE_LINES) {
    const rate = Math.max(0, Math.min(100, attach[key] ?? 0));
    extra += (rate / 100) * (SERVICE_LINE_BY_KEY[key]?.defaultPriceBani ?? 0);
  }
  return Math.round(extra);
}

export function planFromState(state: SimState, vat?: { strategy: VatStrategy }): ProjectionPlan {
  return {
    pricePerBuildingBani: state.priceBani + attachExtraPerBuildingBani(state.attach),
    startBuildings: state.buildings,
    growthPerMonth: state.growthPerMonth,
    hoursPerVisit: state.hoursPerVisit,
    visitsPerWeek: state.visitsPerWeek,
    wageMix: { fulltimeCount: state.fulltimeCount, flex: state.flex },
    overheadBani: state.overheadBani,
    platformFeeBani: state.platformFeeBani,
    partTimeFloorBani: state.partTimeFloorBani,
    turnovers:
      state.turnoversPerWeek > 0
        ? { perWeek: state.turnoversPerWeek, priceBani: state.turnoverPriceBani }
        : undefined,
    vat: vat ? { registered: true, strategy: vat.strategy } : undefined,
  };
}

export function computeResults(state: SimState): SimResults {
  const unit = buildingUnitEconomics({
    priceBani: state.priceBani,
    hoursPerVisit: state.hoursPerVisit,
    visitsPerWeek: state.visitsPerWeek,
  });
  const vat = state.vatRegistered ? { strategy: state.vatStrategy } : undefined;
  const rows = project(24, planFromState(state, vat));
  const now = rows[0]!;
  const at12 = rows[11]!;

  const worthItLineBani = Math.round(
    TARGETS.SUCCESS_PROFIT_EUR_MONTHLY * state.ronPerEur * 100
  );
  const worthItMonth = rows.findIndex((r) => r.profitBani >= worthItLineBani);

  // Blended cost per productive hour across the configured mix.
  const mixHours = wageMixProductiveHours({
    fulltimeCount: state.fulltimeCount,
    flex: state.flex,
  });
  const mixCost = wageMixMonthlyCost(
    { fulltimeCount: state.fulltimeCount, flex: state.flex },
    state.partTimeFloorBani
  );

  const extraPerBuildingBani = attachExtraPerBuildingBani(state.attach);
  const blendedPriceBani = state.priceBani + extraPerBuildingBani;

  return {
    unit,
    rows,
    now,
    at12,
    capacityBuildings: cleanerCapacityBuildings(state.hoursPerVisit, state.visitsPerWeek),
    vatCeiling: vatCeilingBuildings(blendedPriceBani),
    vatCeilingCoreOnly: vatCeilingBuildings(state.priceBani),
    microCeiling: microCeilingBuildings(blendedPriceBani),
    worthItMonth,
    worthItLineBani,
    dividendNetBani: Math.round(Math.max(0, now.profitBani) * 0.84),
    blendedCostPerHourBani: mixHours > 0 ? mixCost / mixHours : null,
    extraPerBuildingBani,
    blendedPriceBani,
  };
}

/** Savings note (§6 guardrail): what a student would save vs a standard part-timer. */
export function studentSavingsBani(row: FlexRow, floorBani: number): number {
  const std = employerCost("parttime_standard", row.hoursPerDay, row.grossMonthlyBani, {
    partTimeFloorBani: floorBani,
  });
  const stu = employerCost("parttime_student", row.hoursPerDay, row.grossMonthlyBani, {
    partTimeFloorBani: floorBani,
  });
  return std.employerTotalBani - stu.employerTotalBani;
}
