// Payroll cost models (§5.2). Pure functions, all money in bani.
// Four worker models feed the Simulator's wage-mix control and Ops payroll
// estimates. Legal basis is in constants.ts comments; the student/pensioner
// exemption from the part-time floor is Cod fiscal art. 146(5^7) + 168(6^1).

import { LABOUR } from "@/lib/constants";

export type WorkerModel =
  | "fulltime_min"
  | "parttime_standard"
  | "parttime_student"
  | "parttime_pensioner";

export const WORKER_MODEL_LABELS: Record<WorkerModel, string> = {
  fulltime_min: "Full-time (min wage)",
  parttime_standard: "Part-time (standard)",
  parttime_student: "Part-time student (<26)",
  parttime_pensioner: "Part-time pensioner",
};

export interface PayrollBreakdown {
  model: WorkerModel;
  grossBani: number;
  employeeCasBani: number;
  employeeCassBani: number;
  incomeTaxBani: number;
  netBani: number;
  employerCamBani: number;
  /** Employer-paid top-up to the part-time contribution floor (standard model only). */
  floorTopUpBani: number;
  employerTotalBani: number;
}

/** Default gross for a part-timer when none is set: pro-rata of the minimum wage. */
export function defaultGrossForHours(hoursPerDay: number): number {
  return Math.round((LABOUR.MIN_WAGE_GROSS * hoursPerDay) / 8);
}

export function employerCost(
  model: WorkerModel,
  hoursPerDay: number,
  grossMonthlyBani?: number,
  opts?: { partTimeFloorBani?: number }
): PayrollBreakdown {
  if (model === "fulltime_min") {
    // Anchored on the researched constants, not re-derived: the net figure
    // embeds the 200-lei exempt allowance treatment (§4).
    const gross = LABOUR.MIN_WAGE_GROSS;
    const cas = Math.round(gross * LABOUR.EMPLOYEE_CAS);
    const cass = Math.round(gross * LABOUR.EMPLOYEE_CASS);
    const net = LABOUR.MIN_WAGE_NET;
    const tax = gross - cas - cass - net; // residual so the sum is exact
    return {
      model,
      grossBani: gross,
      employeeCasBani: cas,
      employeeCassBani: cass,
      incomeTaxBani: tax,
      netBani: net,
      employerCamBani: LABOUR.EMPLOYER_COST_FULLTIME - gross,
      floorTopUpBani: 0,
      employerTotalBani: LABOUR.EMPLOYER_COST_FULLTIME,
    };
  }

  const gross = grossMonthlyBani ?? defaultGrossForHours(hoursPerDay);
  const cas = Math.round(gross * LABOUR.EMPLOYEE_CAS);
  const cass = Math.round(gross * LABOUR.EMPLOYEE_CASS);

  // Personal deduction; students under 26 get the +15%-of-min-wage supplement.
  let deduction = LABOUR.BASIC_DEDUCTION;
  if (model === "parttime_student") {
    deduction += Math.round(LABOUR.STUDENT_EXTRA_DEDUCTION * LABOUR.MIN_WAGE_GROSS);
  }
  const taxable = Math.max(0, gross - cas - cass - deduction);
  const tax = Math.round(taxable * LABOUR.INCOME_TAX);
  const net = gross - cas - cass - tax;

  const cam = Math.round(gross * LABOUR.EMPLOYER_CAM);

  // The floor: employer pays CAS+CASS as if on full min wage, regardless of
  // hours. Students under 26 and pensioners are exempt.
  const floor = opts?.partTimeFloorBani ?? LABOUR.PART_TIME_FLOOR_MONTHLY;
  const floorTopUp =
    model === "parttime_standard" ? Math.max(0, floor - (cas + cass)) : 0;

  return {
    model,
    grossBani: gross,
    employeeCasBani: cas,
    employeeCassBani: cass,
    incomeTaxBani: tax,
    netBani: net,
    employerCamBani: cam,
    floorTopUpBani: floorTopUp,
    employerTotalBani: gross + cam + floorTopUp,
  };
}
