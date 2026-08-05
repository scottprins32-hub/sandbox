import { describe, expect, it } from "vitest";
import {
  ACCESS_LABEL_RO,
  AVIZIER_PHOTO_WARNING,
  INFORM_DEADLINE_DAYS,
  monthsUntil,
  priorityRank,
  ROUTE_SEEDS,
  scorecard,
  STREETS_REFERENCE,
} from "./field-data";

describe("field prospecting data (add-on 2 §3)", () => {
  it("seeds the five surveyed routes in walking order", () => {
    expect(ROUTE_SEEDS).toHaveLength(5);
    expect(ROUTE_SEEDS.map((r) => r.orderIndex)).toEqual([1, 2, 3, 4, 5]);
    expect(ROUTE_SEEDS[0]!.name).toBe("În spatele Lidl");
    // Route 1 ends at the existing contract — the reason it goes first.
    expect(ROUTE_SEEDS[0]!.streets).toContain("Fântânii");
    expect(ROUTE_SEEDS[0]!.parkAtLat).toBeCloseTo(45.70778, 5);
    expect(ROUTE_SEEDS[0]!.parkAtLng).toBeCloseTo(21.2328, 5);
  });

  it("keeps the surveyed block counts", () => {
    expect(ROUTE_SEEDS.map((r) => r.estBuildings)).toEqual([53, 52, 55, 67, 8]);
    const byName = Object.fromEntries(STREETS_REFERENCE.map((s) => [s.name, s.blocks]));
    expect(byName["Calea Timișoarei"]).toBe(23);
    expect(byName["Liliacului"]).toBe(16);
    expect(byName["Cucului"]).toBe(11);
    expect(byName["Dacilor"]).toBe(11);
  });

  it("uses comma-below diacritics everywhere", () => {
    const cedilla = /[şţŞŢ]/;
    for (const r of ROUTE_SEEDS) {
      expect(cedilla.test(r.name + r.notes + r.description), r.name).toBe(false);
      for (const s of r.streets) expect(cedilla.test(s), s).toBe(false);
    }
    for (const s of STREETS_REFERENCE) expect(cedilla.test(s.name), s.name).toBe(false);
    expect(cedilla.test(AVIZIER_PHOTO_WARNING)).toBe(false);
    expect(Object.values(ACCESS_LABEL_RO).every((v) => !cedilla.test(v))).toBe(true);
  });

  it("warns about the payment list on the avizier capture", () => {
    expect(AVIZIER_PHOTO_WARNING).toContain("lista de plată");
  });

  it("marks an open building with no cleaner and a bin photo as high priority", () => {
    const s = scorecard({
      access: "deschis",
      incumbent: "niciunul",
      hasBinPhoto: true,
      ownership: "asociatie",
      assemblyMonth: null,
      currentMonth: 8,
    });
    expect(s.tags).toContain("prioritate_mare");
    expect(s.reasonRo).toContain("Acces liber");
    expect(s.reasonRo).toContain("fără firmă de curățenie");
  });

  it("does not promote a building that still has a cleaning firm", () => {
    const s = scorecard({
      access: "deschis",
      incumbent: "firma",
      hasBinPhoto: true,
      ownership: "asociatie",
      currentMonth: 8,
    });
    expect(s.tags).not.toContain("prioritate_mare");
  });

  it("flags the assembly window and wraps across the year", () => {
    // August now, assembly in November: three months out, inside the window.
    const s = scorecard({
      access: "interfon",
      incumbent: "necunoscut",
      hasBinPhoto: false,
      ownership: "asociatie",
      assemblyMonth: 11,
      currentMonth: 8,
    });
    expect(s.tags).toContain("sezon");
    expect(s.reasonRo).toContain("noiembrie");
    // November now, assembly in February: still three months out.
    expect(monthsUntil(2, 11)).toBe(3);
    expect(monthsUntil(3, 8)).toBe(7);
  });

  it("routes gated and developer-run stock to B2B instead of door-knocking", () => {
    const gated = scorecard({
      access: "poarta",
      incumbent: "necunoscut",
      hasBinPhoto: false,
      ownership: "necunoscut",
      currentMonth: 8,
    });
    expect(gated.tags).toContain("prin_dezvoltator");

    const dev = scorecard({
      access: "interfon",
      incumbent: "niciunul",
      hasBinPhoto: false,
      ownership: "dezvoltator",
      currentMonth: 8,
    });
    expect(dev.tags).toContain("prin_dezvoltator");
  });

  it("always gives a visible reason, never a score", () => {
    const s = scorecard({
      access: "necunoscut",
      incumbent: "necunoscut",
      hasBinPhoto: false,
      ownership: "necunoscut",
      currentMonth: 8,
    });
    expect(s.reasonRo.length).toBeGreaterThan(5);
    expect(s.reasonRo).not.toMatch(/\d+\s*(puncte|%|\/\s*\d)/);
  });

  it("ranks high priority above season above unknown above developer", () => {
    expect(priorityRank(["prioritate_mare"])).toBeLessThan(priorityRank(["sezon"]));
    expect(priorityRank(["sezon"])).toBeLessThan(priorityRank([]));
    expect(priorityRank([])).toBeLessThan(priorityRank(["prin_dezvoltator"]));
  });

  it("keeps the GDPR art. 14 deadline at one month", () => {
    expect(INFORM_DEADLINE_DAYS).toBe(30);
  });
});
