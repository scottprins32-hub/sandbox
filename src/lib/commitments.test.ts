import { describe, expect, it } from "vitest";
import {
  COMMITMENTS,
  DAY,
  HOUR,
  measureCommitments,
  monthBounds,
  resultLineRo,
  workingDayDeadline,
  type MeasurableIssue,
} from "./commitments";

const base: MeasurableIssue = {
  category: "altele",
  source: "tenant",
  createdAt: 0,
  acknowledgedAt: null,
  resolvedAt: null,
  photoFileKey: null,
};

/** 2026-06-10 is a Wednesday; 2026-06-12 a Friday. */
const WED = Date.UTC(2026, 5, 10, 9, 0);
const FRI = Date.UTC(2026, 5, 12, 9, 0);

function measure(issues: MeasurableIssue[], month = "2026-06") {
  return measureCommitments({ month, issues, protocols: [] });
}
function byKey(rs: ReturnType<typeof measure>, key: string) {
  return rs.find((r) => r.key === key)!;
}

describe("service commitments (add-on 2 §C4)", () => {
  it("prints the six seeded promises with comma-below diacritics", () => {
    expect(COMMITMENTS).toHaveLength(6);
    const all = COMMITMENTS.map((c) => c.textRo).join(" ");
    // Cedilla forms (ş ţ) are the wrong characters for Romanian — §1.4.
    expect(all).not.toMatch(/[şţŞŢ]/);
    expect(all).toMatch(/Deșeuri/);
    expect(all).toMatch(/Defecțiune/);
  });

  it("promises nothing free — no discount, credit, refund or trial", () => {
    const all = COMMITMENTS.map((c) => c.textRo.toLowerCase()).join(" ");
    for (const banned of ["gratuit", "gratis", "reducere", "discount", "ramburs", "credit"]) {
      expect(all).not.toContain(banned);
    }
  });

  describe("one working day", () => {
    it("gives until the end of Thursday for a Wednesday report", () => {
      const deadline = workingDayDeadline(WED, 1);
      expect(new Date(deadline).toISOString().slice(0, 10)).toBe("2026-06-11");
    });

    it("skips the weekend: a Friday report is due Monday", () => {
      const deadline = workingDayDeadline(FRI, 1);
      expect(new Date(deadline).toISOString().slice(0, 10)).toBe("2026-06-15");
    });
  });

  it("counts an acknowledgement inside one working day, and misses a late one", () => {
    const rs = measure([
      { ...base, createdAt: WED, acknowledgedAt: WED + 2 * HOUR },
      { ...base, createdAt: WED, acknowledgedAt: WED + 3 * DAY }, // Saturday
      { ...base, createdAt: WED, acknowledgedAt: null }, // never confirmed
    ]);
    const r = byKey(rs, "sesizare_confirmata");
    expect(r.total).toBe(3);
    expect(r.met).toBe(1);
    expect(resultLineRo(r)).toBe("Sesizări confirmate în 1 zi lucrătoare: 1 din 3");
  });

  it("judges only closed bulb reports — an open one has not failed yet", () => {
    const rs = measure([
      { ...base, category: "bec", createdAt: WED, resolvedAt: WED + 47 * HOUR },
      { ...base, category: "bec", createdAt: WED, resolvedAt: WED + 49 * HOUR },
      { ...base, category: "bec", createdAt: WED, resolvedAt: null },
    ]);
    const r = byKey(rs, "bec_48h");
    expect(r.total).toBe(2);
    expect(r.met).toBe(1);
  });

  it("gives bulky waste seven days", () => {
    const rs = measure([
      { ...base, category: "deseuri", createdAt: WED, resolvedAt: WED + 7 * DAY },
      { ...base, category: "deseuri", createdAt: WED, resolvedAt: WED + 8 * DAY },
    ]);
    expect(byKey(rs, "deseuri_7z")).toMatchObject({ total: 2, met: 1 });
  });

  it("counts a cleaner's fault report only when the photo is attached", () => {
    const rs = measure([
      { ...base, source: "cleaner", category: "defectiune", photoFileKey: "a.jpg" },
      { ...base, source: "cleaner", category: "defectiune", photoFileKey: null },
      // A tenant's report is not the cleaner's commitment.
      { ...base, source: "tenant", category: "defectiune", photoFileKey: null },
    ]);
    expect(byKey(rs, "defect_raportat")).toMatchObject({ total: 2, met: 1 });
  });

  it("says nothing at all about snow clearing, because nothing proves it", () => {
    const r = byKey(measure([]), "deszapezire_7");
    expect(r.unmeasured).toBe(true);
    expect(resultLineRo(r)).toBeNull();
  });

  it("never shows a hollow score when there was nothing to judge", () => {
    const r = byKey(measure([]), "bec_48h");
    expect(r.total).toBe(0);
    expect(resultLineRo(r)).toBe("Becuri înlocuite în 48 de ore: nu a fost cazul luna aceasta");
  });

  it("holds the monthly report to the 5th of the following month", () => {
    const rs = measureCommitments({
      month: "2026-06",
      issues: [],
      protocols: [
        { month: "2026-05", generatedAt: Date.UTC(2026, 5, 5, 10, 0) }, // on the 5th: met
        { month: "2026-04", generatedAt: Date.UTC(2026, 4, 6, 10, 0) }, // the 6th: late
        { month: "2026-07", generatedAt: 0 }, // not due yet, not judged
      ],
    });
    expect(byKey(rs, "raport_5")).toMatchObject({ total: 2, met: 1 });
  });

  it("bounds a month on Bucharest midnight, not UTC", () => {
    const { from, to } = monthBounds("2026-06");
    // Romania is UTC+3 in June, so the month opens at 21:00 UTC on 31 May.
    expect(new Date(from).toISOString()).toBe("2026-05-31T21:00:00.000Z");
    expect(new Date(to).toISOString()).toBe("2026-06-30T21:00:00.000Z");
  });
});
