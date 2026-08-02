// Section A definition of done (add-on §3).
// Note: the DoD text says "24 records present" but the specification tables
// list 26 (3 DDD + 6 fire + 3 gas + 3 structure + 6 waste + 5 conditional).
// The records are the research output and must not be trimmed to hit a count,
// so 26 is asserted here and the discrepancy is logged in DECISIONS.md.

import { describe, expect, it } from "vitest";
import { OBLIGATIONS, OBLIGATION_BY_KEY } from "./catalogue";
import {
  addMonthsYmd,
  addYearsYmd,
  applicableObligations,
  largestExposures,
  maxExposureBani,
  nextDueDate,
  statusOf,
} from "./helpers";

describe("catalogue integrity", () => {
  it("contains all 26 researched obligations", () => {
    expect(OBLIGATIONS).toHaveLength(26);
  });

  it("every record has a non-empty legalBasis and sourceNote", () => {
    for (const o of OBLIGATIONS) {
      expect(o.legalBasis.length, `${o.key} legalBasis`).toBeGreaterThan(0);
      expect(o.legalBasis.every((c) => c.trim().length > 0), `${o.key} citations`).toBe(true);
      expect(o.sourceNote.trim().length, `${o.key} sourceNote`).toBeGreaterThan(0);
    }
  });

  it("keys are unique and stable", () => {
    const keys = OBLIGATIONS.map((o) => o.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(OBLIGATION_BY_KEY["psi_iluminat_siguranta"]?.fineMaxBani).toBe(25000_00);
  });

  it("fine ranges are ordered when both ends are known", () => {
    for (const o of OBLIGATIONS) {
      if (o.fineMinBani !== null && o.fineMaxBani !== null) {
        expect(o.fineMinBani, `${o.key}`).toBeLessThanOrEqual(o.fineMaxBani);
      }
    }
  });

  it("preserves research uncertainty rather than tidying it away", () => {
    // The five records the research explicitly flagged.
    for (const key of [
      "ddd_dezinsectie",
      "urmarire_curenta",
      "zapada_gheata",
      "lift_iscir",
      "pram",
    ]) {
      expect(OBLIGATION_BY_KEY[key]?.needsVerification, key).toBeTruthy();
    }
  });

  it("never lets a Scara cleaner own an authorised or qualified obligation", () => {
    // §2.3: DDD, gas, lift and the annual report are not ours to perform.
    for (const key of [
      "ddd_dezinsectie",
      "ddd_deratizare",
      "ddd_dezinfectie",
      "gaz_verificare",
      "lift_iscir",
      "lift_rsvti",
    ]) {
      expect(OBLIGATION_BY_KEY[key]?.performerRequirement, key).toBe(
        "authorised_third_party"
      );
    }
    expect(OBLIGATION_BY_KEY["urmarire_curenta"]?.performerRequirement).toBe(
      "qualified_signatory"
    );
    expect(OBLIGATION_BY_KEY["carte_tehnica"]?.performerRequirement).toBe(
      "qualified_signatory"
    );
  });

  it("the enforcement hot zone is ours to perform", () => {
    for (const key of [
      "deseuri_platforma",
      "deseuri_sortare",
      "trotuar_curatenie",
      "zapada_gheata",
      "spatiu_verde",
      "fatada_siguranta",
    ]) {
      expect(OBLIGATION_BY_KEY[key]?.performerRequirement, key).toBe("us");
    }
  });
});

describe("calendar arithmetic", () => {
  it("adds months across a year boundary", () => {
    expect(addMonthsYmd("2026-11-15", 3)).toBe("2027-02-15");
    expect(addMonthsYmd("2026-12-31", 1)).toBe("2027-01-31");
  });

  it("clamps to the last day of a shorter target month", () => {
    expect(addMonthsYmd("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsYmd("2028-01-31", 1)).toBe("2028-02-29"); // leap year
  });

  it("adds years across a leap day", () => {
    expect(addYearsYmd("2028-02-29", 1)).toBe("2029-02-28");
    expect(addYearsYmd("2026-06-19", 2)).toBe("2028-06-19");
  });
});

describe("nextDueDate per cadence kind", () => {
  const g = (k: string) => OBLIGATION_BY_KEY[k]!;

  it("years: emergency lighting moves exactly one year", () => {
    expect(nextDueDate(g("psi_iluminat_siguranta"), "2026-03-10")).toBe("2027-03-10");
  });

  it("years every 2: gas verification, across a year boundary", () => {
    expect(nextDueDate(g("gaz_verificare"), "2026-11-20")).toBe("2028-11-20");
  });

  it("months: rodent control every 6 months", () => {
    expect(nextDueDate(g("ddd_deratizare"), "2026-09-01")).toBe("2027-03-01");
  });

  it("fixed perYear: quarterly DDD resolves to a 3-month step", () => {
    expect(nextDueDate(g("ddd_dezinsectie"), "2026-10-05")).toBe("2027-01-05");
  });

  it("continuous and event cadences have no due date", () => {
    expect(nextDueDate(g("carte_tehnica"), "2026-01-01")).toBeNull();
    expect(nextDueDate(g("zapada_gheata"), "2026-01-01")).toBeNull();
  });

  it("once: returns the statutory deadline", () => {
    expect(nextDueDate(g("plumb_inventar"), null)).toBe("2027-12-31");
  });

  it("seasonal: green space rolls to next April once this season is served", () => {
    expect(nextDueDate(g("spatiu_verde"), null, "2026-05-10")).toBe("2026-04-01");
    expect(nextDueDate(g("spatiu_verde"), "2026-04-15", "2026-05-10")).toBe("2027-04-01");
    // Asking in November, after the season closed.
    expect(nextDueDate(g("spatiu_verde"), null, "2026-11-10")).toBe("2027-04-01");
  });

  it("an interval obligation never performed has no anchor to count from", () => {
    expect(nextDueDate(g("psi_iluminat_siguranta"), null)).toBeNull();
  });
});

describe("statusOf", () => {
  const lighting = OBLIGATION_BY_KEY["psi_iluminat_siguranta"]!;

  it("never recorded is unknown, not ok", () => {
    expect(statusOf(lighting, null, "2026-07-31")).toBe("unknown");
  });

  it("overdue when the due date has passed", () => {
    expect(statusOf(lighting, "2025-01-01", "2026-07-31")).toBe("overdue");
  });

  it("due_soon inside the 30-day window, ok outside it", () => {
    // Done 2025-08-20 → due 2026-08-20; 20 days out on 2026-07-31.
    expect(statusOf(lighting, "2025-08-20", "2026-07-31")).toBe("due_soon");
    // Done 2025-12-01 → due 2026-12-01, far away.
    expect(statusOf(lighting, "2025-12-01", "2026-07-31")).toBe("ok");
  });

  it("exactly 30 days out is still due_soon; 31 is ok", () => {
    expect(statusOf(lighting, "2025-08-30", "2026-07-31")).toBe("due_soon");
    expect(statusOf(lighting, "2025-08-31", "2026-07-31")).toBe("ok");
  });

  it("continuous obligations are unknown until recorded, then ok", () => {
    const carte = OBLIGATION_BY_KEY["carte_tehnica"]!;
    expect(statusOf(carte, null, "2026-07-31")).toBe("unknown");
    expect(statusOf(carte, "2026-02-01", "2026-07-31")).toBe("ok");
  });
});

describe("applicability by building flags", () => {
  it("a 3-floor block with gas and no lift gets gas obligations and no lift ones", () => {
    const keys = applicableObligations({
      hasGas: true,
      hasLift: false,
      hasPlayground: false,
      hasBasement: true,
    }).map((o) => o.key);

    expect(keys).toContain("gaz_verificare");
    expect(keys).toContain("gaz_revizie");
    expect(keys).toContain("cos_fum");
    expect(keys).toContain("subsol_apa");
    expect(keys).not.toContain("lift_iscir");
    expect(keys).not.toContain("lift_rsvti");
    expect(keys).not.toContain("loc_joaca");
    // Always-on obligations are still there.
    expect(keys).toContain("deseuri_platforma");
    expect(keys).toContain("psi_iluminat_siguranta");
  });

  it("a building with nothing set gets only the always-on subset", () => {
    const keys = applicableObligations({}).map((o) => o.key);
    expect(keys).not.toContain("gaz_verificare");
    expect(keys).not.toContain("subsol_apa");
    expect(keys).toContain("trotuar_curatenie");
  });
});

describe("maximum statutory exposure", () => {
  const now = "2026-07-31";

  it("sums only overdue and never-recorded obligations", () => {
    const lighting = OBLIGATION_BY_KEY["psi_iluminat_siguranta"]!; // 25,000
    const platform = OBLIGATION_BY_KEY["deseuri_platforma"]!; // 2,500
    const sorting = OBLIGATION_BY_KEY["deseuri_sortare"]!; // 60,000

    const total = maxExposureBani(
      [
        { obligation: lighting, lastDoneDate: null }, // unknown → counts
        { obligation: platform, lastDoneDate: "2026-07-01" }, // continuous, ok → excluded
        { obligation: sorting, lastDoneDate: null }, // unknown → counts
      ],
      now
    );
    expect(total).toBe(25000_00 + 60000_00);
  });

  it("covering an obligation removes its exposure", () => {
    const lighting = OBLIGATION_BY_KEY["psi_iluminat_siguranta"]!;
    const before = maxExposureBani([{ obligation: lighting, lastDoneDate: null }], now);
    const after = maxExposureBani(
      [{ obligation: lighting, lastDoneDate: "2026-07-01" }],
      now
    );
    expect(before - after).toBe(25000_00);
  });

  it("obligations with no statutory figure contribute nothing", () => {
    const pram = OBLIGATION_BY_KEY["pram"]!; // fineMax null
    expect(maxExposureBani([{ obligation: pram, lastDoneDate: null }], now)).toBe(0);
  });

  it("names the two largest uncovered exposures", () => {
    const entries = applicableObligations({ hasLift: true, hasGas: true }).map((o) => ({
      obligation: o,
      lastDoneDate: null,
    }));
    const top = largestExposures(entries, 2, now);
    expect(top).toHaveLength(2);
    // Waste sorting (60,000) and RSVTI (40,000) are the two biggest.
    expect(top[0]!.obligation.key).toBe("deseuri_sortare");
    expect(top[1]!.obligation.key).toBe("lift_rsvti");
  });
});
