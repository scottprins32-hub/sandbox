// Payroll export data (§7.2): per cleaner for a month — visits done, hours
// (visit durations, falling back to the building's hours_per_visit), worker
// model, modeled employer cost from the finance module.

import { employerCost, defaultGrossForHours } from "@/lib/finance";
import { listCleaners } from "./repo/cleaners";
import { listVisitsInMonth } from "./repo/visits";
import { listBuildings } from "./repo/buildings";

export interface PayrollRow {
  cleanerId: string;
  name: string;
  workerModel: string;
  hoursPerDay: number;
  visitsDone: number;
  hours: number;
  employerCostBani: number;
  netEstimateBani: number;
}

export async function payrollForMonth(orgId: string, monthKey: string): Promise<PayrollRow[]> {
  const [cleaners, visits, buildings] = await Promise.all([
    listCleaners(orgId),
    listVisitsInMonth(orgId, monthKey),
    listBuildings(orgId),
  ]);
  const buildingById = new Map(buildings.map((b) => [b.id, b]));

  return cleaners.map((c) => {
    const mine = visits.filter((v) => v.cleanerId === c.id && v.status === "done");
    let hours = 0;
    for (const v of mine) {
      if (v.startedAt && v.finishedAt && v.finishedAt > v.startedAt) {
        hours += (v.finishedAt - v.startedAt) / 3_600_000;
      } else if (v.buildingId) {
        hours += buildingById.get(v.buildingId)?.hoursPerVisit ?? 1.5;
      } else {
        hours += 2; // turnover default (SERVICE.TURNOVER.DEFAULT_HOURS)
      }
    }
    const gross = defaultGrossForHours(c.hoursPerDay);
    const bd = employerCost(c.workerModel, c.hoursPerDay, gross);
    return {
      cleanerId: c.id,
      name: c.name,
      workerModel: c.workerModel,
      hoursPerDay: c.hoursPerDay,
      visitsDone: mine.length,
      hours: Math.round(hours * 10) / 10,
      employerCostBani: bd.employerTotalBani,
      netEstimateBani: bd.netBani,
    };
  });
}

export function payrollCsv(rows: PayrollRow[], monthKey: string): string {
  const header =
    "month,cleaner,worker_model,hours_per_day,visits_done,hours_worked,employer_cost_lei,net_estimate_lei";
  const lines = rows.map((r) =>
    [
      monthKey,
      `"${r.name}"`,
      r.workerModel,
      r.hoursPerDay,
      r.visitsDone,
      r.hours,
      (r.employerCostBani / 100).toFixed(2),
      (r.netEstimateBani / 100).toFixed(2),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}
