import { describe, expect, it } from "vitest";
import {
  ELEMENT_BY_KEY,
  FINDING_CATEGORY_TO_ELEMENT,
  SCORE_BY_VALUE,
  SCORE_SCALE,
  STANDARD_ELEMENTS,
  trendKey,
  TREND_LABEL_EN,
  TREND_LABEL_RO,
} from "./elements";

describe("building elements (add-on §6)", () => {
  it("defines the twelve standard elements with unique keys", () => {
    expect(STANDARD_ELEMENTS).toHaveLength(12);
    expect(new Set(STANDARD_ELEMENTS.map((e) => e.key)).size).toBe(12);
  });

  it("uses only the six spec categories", () => {
    const allowed = new Set([
      "structura",
      "invelitoare",
      "fatada",
      "instalatii",
      "finisaje",
      "exterior",
    ]);
    for (const e of STANDARD_ELEMENTS) expect(allowed.has(e.category)).toBe(true);
  });

  it("scores 1-6, each with a label and a one-line definition", () => {
    expect(SCORE_SCALE.map((s) => s.score)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const s of SCORE_SCALE) {
      expect(s.labelRo.length).toBeGreaterThan(2);
      expect(s.definitionRo.length).toBeGreaterThan(10);
    }
    expect(SCORE_BY_VALUE[1]!.labelRo).toBe("Excelent");
    expect(SCORE_BY_VALUE[6]!.labelRo).toBe("Foarte slab");
  });

  it("maps finding categories to real elements", () => {
    for (const key of Object.values(FINDING_CATEGORY_TO_ELEMENT)) {
      expect(ELEMENT_BY_KEY[key]).toBeDefined();
    }
  });

  it("keys the year-over-year trend (lower score is better)", () => {
    expect(trendKey(2, 3)).toBe("improved");
    expect(trendKey(4, 3)).toBe("declined");
    expect(trendKey(3, 3)).toBe("stable");
    expect(trendKey(3, null)).toBe("first");
  });

  it("labels every trend key in both languages", () => {
    for (const key of ["first", "improved", "declined", "stable"] as const) {
      expect(TREND_LABEL_EN[key].length).toBeGreaterThan(2);
      expect(TREND_LABEL_RO[key].length).toBeGreaterThan(2);
    }
  });

  it("carries an English name and definition for every element and score", () => {
    for (const e of STANDARD_ELEMENTS) expect(e.nameEn.length).toBeGreaterThan(2);
    for (const s of SCORE_SCALE) {
      expect(s.labelEn.length).toBeGreaterThan(2);
      expect(s.definitionEn.length).toBeGreaterThan(10);
    }
  });
});
