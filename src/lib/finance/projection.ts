// Projection engine (§5.3). Pure; all money in bani.

import { LABOUR, SERVICE, TAX, SETUP_COST } from "@/lib/constants";
import {
  buildingUnitEconomics,
  hoursPerBuildingMonth,
  productiveHoursPerFulltime,
} from "./core";
import { employerCost, defaultGrossForHours, type WorkerModel } from "./payroll";
import { vatAbsorb, vatReprice } from "./vat";

export interface FlexRow {
  model: Exclude<WorkerModel, "fulltime_min">;
  count: number;
  hoursPerDay: number;
  /** Defaults to pro-rata minimum wage for the hours. */
  grossMonthlyBani?: number;
}

export interface WageMix {
  fulltimeCount: number;
  flex: FlexRow[];
}

export interface TurnoverPlan {
  perWeek: number;
  priceBani: number;
  hoursPerJob?: number;
}

export interface ProjectionPlan {
  pricePerBuildingBani: number;
  /** Either an explicit ramp... */
  buildingsByMonth?: number[];
  /** ...or a start + linear growth. */
  startBuildings?: number;
  growthPerMonth?: number;
  hoursPerVisit: number;
  visitsPerWeek: number;
  wageMix: WageMix;
  overheadBani: number;
  consumablesPerBuildingBani?: number;
  travelPerBuildingBani?: number;
  platformFeeBani?: number;
  turnovers?: TurnoverPlan;
  /** VAT-registered mode (§6 toggle). Off = current regime. */
  vat?: { registered: boolean; strategy: "reprice" | "absorb" };
  setupCostBani?: number;
  partTimeFloorBani?: number;
}

export interface MonthRow {
  monthIndex: number; // 0-based
  buildings: number;
  /** Net revenue the company keeps (net of VAT when registered+absorb). */
  revenueBani: number;
  turnoverRevenueBani: number;
  annualizedRunRateBani: number;
  totalHours: number;
  /** ceil(totalHours / productive hours per full-time) — §5.3. */
  cleanersNeeded: number;
  /** Full-timers hired beyond the configured mix to cover the hours. */
  extraFulltimes: number;
  payrollBani: number;
  consumablesBani: number;
  travelBani: number;
  overheadBani: number;
  platformFeeBani: number;
  taxBani: number;
  totalCostBani: number;
  profitBani: number;
  cumulativeCashBani: number;
  vatBreached: boolean;
  microBreached: boolean;
}

// §5.3's default 24-month ramp. At the 3,566 price the VAT flag fires around
// month 5-6 of this ramp — that visibility is the Simulator's whole point.
export const DEFAULT_RAMP_24MO = [
  4, 4, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 31, 34, 37, 40, 43, 45, 47, 49, 51, 53,
];

function buildingsAt(plan: ProjectionPlan, month: number): number {
  if (plan.buildingsByMonth) {
    const arr = plan.buildingsByMonth;
    return arr[Math.min(month, arr.length - 1)] ?? 0;
  }
  const start = plan.startBuildings ?? 4;
  const growth = plan.growthPerMonth ?? 0;
  return Math.round(start + growth * month);
}

/** Monthly employer cost of the configured wage mix, in bani. */
export function wageMixMonthlyCost(mix: WageMix, partTimeFloorBani?: number): number {
  let total = mix.fulltimeCount * LABOUR.EMPLOYER_COST_FULLTIME;
  for (const row of mix.flex) {
    const gross = row.grossMonthlyBani ?? defaultGrossForHours(row.hoursPerDay);
    const bd = employerCost(row.model, row.hoursPerDay, gross, {
      partTimeFloorBani,
    });
    total += row.count * bd.employerTotalBani;
  }
  return total;
}

/** Productive hours per month the configured mix delivers. */
export function wageMixProductiveHours(mix: WageMix): number {
  const perFT = productiveHoursPerFulltime();
  let hours = mix.fulltimeCount * perFT;
  for (const row of mix.flex) {
    hours += row.count * (row.hoursPerDay / 8) * perFT;
  }
  return hours;
}

export function project(months: number, plan: ProjectionPlan): MonthRow[] {
  const rows: MonthRow[] = [];
  const consumablesPerBuilding =
    plan.consumablesPerBuildingBani ?? SERVICE.CONSUMABLES_PER_BUILDING_MONTH;
  const travelPerBuilding =
    plan.travelPerBuildingBani ?? SERVICE.TRAVEL_PER_BUILDING_MONTH;
  const platformFee = plan.platformFeeBani ?? 0;
  const perFT = productiveHoursPerFulltime();
  const mixCost = wageMixMonthlyCost(plan.wageMix, plan.partTimeFloorBani);
  const mixHours = wageMixProductiveHours(plan.wageMix);

  const turnoverJobsPerMonth = plan.turnovers ? (plan.turnovers.perWeek * 52) / 12 : 0;
  const turnoverHoursPerJob = plan.turnovers?.hoursPerJob ?? SERVICE.TURNOVER.DEFAULT_HOURS;

  // Per-building net revenue under the VAT regime.
  const vatOn = plan.vat?.registered === true;
  const netPricePerBuilding = !vatOn
    ? plan.pricePerBuildingBani
    : plan.vat!.strategy === "reprice"
      ? vatReprice(plan.pricePerBuildingBani).netRevenuePerBuildingBani
      : vatAbsorb(plan.pricePerBuildingBani).netRevenuePerBuildingBani;
  // Turnover prices follow the same strategy.
  const netPricePerTurnover = !plan.turnovers
    ? 0
    : !vatOn
      ? plan.turnovers.priceBani
      : plan.vat!.strategy === "reprice"
        ? plan.turnovers.priceBani
        : vatAbsorb(plan.turnovers.priceBani).netRevenuePerBuildingBani;

  let cumulative = -(plan.setupCostBani ?? SETUP_COST);

  for (let m = 0; m < months; m++) {
    const buildings = buildingsAt(plan, m);
    const recurringRevenue = Math.round(buildings * netPricePerBuilding);
    const turnoverRevenue = Math.round(turnoverJobsPerMonth * netPricePerTurnover);
    const revenue = recurringRevenue + turnoverRevenue;

    const totalHours =
      buildings * hoursPerBuildingMonth(plan.hoursPerVisit, plan.visitsPerWeek) +
      turnoverJobsPerMonth * turnoverHoursPerJob;
    const cleanersNeeded = Math.ceil(totalHours / perFT);
    const extraFulltimes = Math.max(0, Math.ceil((totalHours - mixHours) / perFT));
    const payroll = mixCost + extraFulltimes * LABOUR.EMPLOYER_COST_FULLTIME;

    const consumables =
      buildings * consumablesPerBuilding +
      Math.round(turnoverJobsPerMonth * SERVICE.TURNOVER.CONSUMABLES_PER_JOB);
    const travel = buildings * travelPerBuilding;

    const runRate = revenue * 12;
    const vatBreached = runRate > TAX.VAT_THRESHOLD_ANNUAL;
    const microBreached = runRate > TAX.MICRO_CEILING_ANNUAL;

    // Micro: 1% of revenue. Past the micro ceiling: simplified 16% profit tax
    // ("simplified; accountant owns the real numbers" — §6).
    const costBeforeTax = payroll + consumables + travel + plan.overheadBani + platformFee;
    const tax = microBreached
      ? Math.round(Math.max(0, revenue - costBeforeTax) * 0.16)
      : Math.round(revenue * TAX.MICRO_RATE);

    const totalCost = costBeforeTax + tax;
    const profit = revenue - totalCost;
    cumulative += profit;

    rows.push({
      monthIndex: m,
      buildings,
      revenueBani: revenue,
      turnoverRevenueBani: turnoverRevenue,
      annualizedRunRateBani: runRate,
      totalHours,
      cleanersNeeded,
      extraFulltimes,
      payrollBani: payroll,
      consumablesBani: consumables,
      travelBani: travel,
      overheadBani: plan.overheadBani,
      platformFeeBani: platformFee,
      taxBani: tax,
      totalCostBani: totalCost,
      profitBani: profit,
      cumulativeCashBani: cumulative,
      vatBreached,
      microBreached,
    });
  }
  return rows;
}

export { buildingUnitEconomics };
