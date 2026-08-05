import { describe, expect, it } from "vitest";
import { offerCatalogue } from "./offerSections";

describe("offer sections (add-on 2 §D)", () => {
  const walkUp = offerCatalogue({});
  const withLift = offerCatalogue({ hasLift: true });

  it("prints far more line items than the ~15 competitors publish", () => {
    const rows = walkUp.zones.reduce((n, z) => n + z.rows.length, 0);
    // The length of the list is the argument. If this ever drops near 15 the
    // section has stopped saying anything a competitor's does not.
    expect(rows).toBeGreaterThan(35);
  });

  it("never promises to clean a lift the building does not have", () => {
    const walkUpText = JSON.stringify(walkUp).toLowerCase();
    expect(walkUpText).not.toContain("lift");
    expect(JSON.stringify(withLift).toLowerCase()).toContain("lift");
  });

  it("gives every zone a label and every row a frequency", () => {
    for (const zone of walkUp.zones) {
      expect(zone.labelRo).toBeTruthy();
      expect(zone.rows.length).toBeGreaterThan(0);
      for (const row of zone.rows) {
        expect(row.nameRo).toBeTruthy();
        expect(row.frequencyRo).toBeTruthy();
      }
    }
  });

  it("gives every market-gap row the reason it matters", () => {
    expect(walkUp.unique.length).toBeGreaterThan(10);
    for (const u of walkUp.unique) {
      expect(u.nameRo).toBeTruthy();
      expect(u.reasonRo.length, u.nameRo).toBeGreaterThan(30);
    }
  });

  it("carries the six commitments and promises nothing free", () => {
    expect(walkUp.commitments).toHaveLength(6);
    const all = walkUp.commitments.join(" ").toLowerCase();
    for (const banned of [
      "gratuit",
      "gratis",
      "reducere",
      "discount",
      "ramburs",
      "lună gratuită",
    ]) {
      expect(all).not.toContain(banned);
    }
  });
});
