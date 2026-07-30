// CANONICAL CONSTANTS — §4 of the build spec, verbatim.
// Every number below is sourced (Romanian law in force from 1 Jul 2026, BNR FX,
// census, field research). These are the ONLY hardcoded business numbers in the
// entire codebase; everything else derives.
// ALL money values are in bani (integer lei-cents), e.g. 4325_00 = 4,325.00 lei.

export const FX = {
  RON_PER_EUR: 5.2439, // BNR reference, 30 Jul 2026 (editable in Settings)
};

export const LABOUR = {
  MIN_WAGE_GROSS: 4325_00, // bani. HG 146/2026, from 1 Jul 2026
  MIN_WAGE_NET: 2699_00, // what a full-time min-wage employee receives
  EMPLOYER_COST_FULLTIME: 4418_00, // gross + CAM 2.25% (200-lei allowance exempt)
  STATUTORY_HOURS_PER_MONTH: 166.667, // 2,000 h/yr ÷ 12 (NOT 168)
  PRODUCTIVE_SHARE: 0.82, // rest = travel between buildings, leave, sick cover
  // Part-time contribution floor (CAS 25% + CASS 10% on full min wage,
  // paid by employer regardless of hours worked):
  PART_TIME_FLOOR_MONTHLY: 1513_75, // 35% x 4,325 lei. NOTE: one research pass
  // computed 1,444 on a reduced base; accountant
  // to confirm. Use 1,513.75; expose in Settings.
  // Exempt from the floor (Cod fiscal art. 146(5^7) + art. 168(6^1)):
  // students under 26 with proof of enrolment, age pensioners,
  // disability-certificate holders.
  EMPLOYEE_CAS: 0.25,
  EMPLOYEE_CASS: 0.10,
  INCOME_TAX: 0.10,
  EMPLOYER_CAM: 0.0225,
  BASIC_DEDUCTION: 865_00, // deducere personală at min-wage level, 0 dependents
  STUDENT_EXTRA_DEDUCTION: 0.15, // +15% supplementary deduction under 26
  MARKET_NET_4H_TIMISOARA: 1700_00, // observed OLX rate: 4h/day cleaner, net
};

export const SERVICE = {
  DEFAULT_HOURS_PER_VISIT: 1.5, // founders' decision; per 3-floor block
  DEFAULT_VISITS_PER_WEEK: 2,
  CONSUMABLES_PER_BUILDING_MONTH: 50_00, // detergent, bags, mop heads
  TRAVEL_PER_BUILDING_MONTH: 45_00,
  TURNOVER: {
    // Airbnb turnover cleans (locked service line)
    DEFAULT_PRICE: 150_00, // market 120-250 lei per 2-room turnover
    DEFAULT_HOURS: 2.0,
    CONSUMABLES_PER_JOB: 15_00,
  },
};

export const TARGETS = {
  SUCCESS_PROFIT_EUR_MONTHLY: 2000, // the founders' locked "worth it" floor
  STRETCH_BUILDINGS_12MO: 20, // the dream; sits PAST the VAT wall on purpose
  PLATFORM_FEE_MONTHLY_DEFAULT: 0, // bani (spec: 0_00) — Scott's fee; editable in Settings, shown in Simulator
};

export const PRICING = {
  CURRENT_FEE_PER_PERSON_EUR: 40, // what tenants pay today
  TARGET_PRICE_PER_BUILDING: 3566_00, // = ~EUR 680, founders' chosen price
  MARKET_PRICE_3FLOOR_2X: 700_00, // Timișoara market for the same service
  // Published competitor ladder (Curățenie Florin SRL, live 2026), by floors:
  COMPETITOR_LADDER: { 2: 250_00, 4: 400_00, 5: 500_00, 7: 700_00, 8: 800_00, 10: 1200_00 } as Record<
    number,
    number
  >,
};

export const OVERHEAD_MONTHLY = {
  ACCOUNTANT: 500_00,
  SSM_PSI: 60_00,
  LIABILITY_INSURANCE: 100_00,
  EFACTURA_SOFTWARE: 50_00,
  BANK: 60_00,
  PHONE_ADMIN: 120_00,
  MARKETING: 180_00,
}; // total 1,070 lei

export const TAX = {
  MICRO_RATE: 0.01, // single 1% on turnover (OUG 89/2025, from 1 Jan 2026)
  MICRO_CEILING_ANNUAL: 509850_00, // EUR 100k equivalent
  VAT_THRESHOLD_ANNUAL: 395000_00, // OG 22/2025. THE growth wall: clients cannot reclaim VAT
  VAT_RATE: 0.21,
  DIVIDEND_TAX: 0.16, // Legea 141/2025, from 1 Jan 2026
};

export const MARKET = {
  GIROC: { population: 22270, growth10y: 1.65, projectsPerYear: 484, blocksEst: [230, 450] as [number, number] },
  DUMBRAVITA: { population: 20014, projectsPerYear: 385 },
  TIMISOARA: {
    blocks: [5500, 6600] as [number, number],
    associations: [2850, 4100] as [number, number],
    students: 44000,
    shortLets: 837,
  },
  ADMIN_FEE_PER_APT: [20_00, 40_00] as [number, number], // administrare imobile, per apartment/month (upsell path)
};

export const SEED_BUILDINGS = {
  count: 4,
  residentsEach: 24,
  apartmentsEach: 11,
  floors: 3,
  street: "Strada Fântânii",
  locality: "Giroc, Timiș",
  currentFeePerBuilding: 5034_00, // 24 x EUR40 at FX
};

export const OVERHEAD_TOTAL_MONTHLY = Object.values(OVERHEAD_MONTHLY).reduce((a, b) => a + b, 0); // 1,070 lei

// One-off setup cost seeding the projection's cumulative cash line (§5.3).
export const SETUP_COST = 7100_00;
