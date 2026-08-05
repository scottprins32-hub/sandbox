import { describe, expect, it } from "vitest";
import {
  FREQUENCY_LABEL_RO,
  frequencyTableRo,
  scheduleGroupsRo,
  SERVICE_TASKS,
  TASK_BY_KEY,
  tasksForPackage,
  totalMinutesPerVisit,
  uniqueVsMarket,
  ZONE_LABEL_EN,
  ZONE_LABEL_RO,
  ZONE_ORDER,
  type ServiceTask,
} from "./task-catalogue";

describe("service task catalogue (add-on 2 §2)", () => {
  it("holds the audited task set with unique keys", () => {
    expect(SERVICE_TASKS.length).toBeGreaterThanOrEqual(55);
    expect(new Set(SERVICE_TASKS.map((t) => t.key)).size).toBe(SERVICE_TASKS.length);
  });

  it("gives every record a zone, a frequency and a coverage number", () => {
    for (const t of SERVICE_TASKS) {
      expect(ZONE_ORDER, `${t.key} zone`).toContain(t.zone);
      expect(FREQUENCY_LABEL_RO[t.defaultFrequency], `${t.key} frequency`).toBeTruthy();
      expect(Number.isInteger(t.competitorCoverage), `${t.key} coverage`).toBe(true);
      expect(t.competitorCoverage).toBeGreaterThanOrEqual(0);
      expect(t.competitorCoverage).toBeLessThanOrEqual(20);
      expect(t.effortMinutes, `${t.key} minutes`).toBeGreaterThan(0);
      expect(t.nameRo.length, `${t.key} nameRo`).toBeGreaterThan(3);
      expect(t.nameEn.length, `${t.key} nameEn`).toBeGreaterThan(3);
    }
  });

  it("labels every zone in both languages", () => {
    for (const z of ZONE_ORDER) {
      expect(ZONE_LABEL_RO[z].length).toBeGreaterThan(2);
      expect(ZONE_LABEL_EN[z].length).toBeGreaterThan(2);
    }
  });

  it("uses comma-below diacritics, never cedilla", () => {
    const cedilla = /[şţŞŢ]/;
    for (const t of SERVICE_TASKS) {
      expect(cedilla.test(t.nameRo), `${t.key} nameRo cedilla`).toBe(false);
      expect(cedilla.test(t.gapNote ?? ""), `${t.key} gapNote cedilla`).toBe(false);
    }
  });

  it("keeps the audit's zero-coverage findings intact", () => {
    // These are the competitor gaps the offer is built on. If one of these
    // moves, it must be because the audit was redone, not because a number
    // was tidied.
    const zeros = [
      "plinte",
      "degresare_balustrade",
      "avizier_ordonat",
      "buruieni",
      "rigole",
      "copertina",
      "becuri",
      "raportare_defecte",
      "plante_intrare",
    ];
    for (const key of zeros) {
      expect(TASK_BY_KEY[key]?.competitorCoverage, key).toBe(0);
    }
    expect(TASK_BY_KEY["pubele_readus"]?.competitorCoverage).toBe(2);
    expect(TASK_BY_KEY["pliante"]?.competitorCoverage).toBe(1);
  });

  it("filters lift and basement tasks by the building's flags", () => {
    const walkUp = tasksForPackage({ hasBasement: true });
    expect(walkUp.some((t) => t.zone === "lift")).toBe(false);
    expect(walkUp.some((t) => t.key === "subsol")).toBe(true);

    const withLift = tasksForPackage({ hasLift: true, hasBasement: false });
    expect(withLift.some((t) => t.key === "cabina_lift")).toBe(true);
    expect(withLift.some((t) => t.key === "subsol")).toBe(false);
  });

  it("excludes priced extras from the base package unless asked", () => {
    const base = tasksForPackage({ hasLift: true, hasParking: true });
    expect(base.some((t) => t.key === "parcare_subterana")).toBe(false);
    const all = tasksForPackage({ hasLift: true, hasParking: true }, { baseOnly: false });
    expect(all.some((t) => t.key === "parcare_subterana")).toBe(true);
  });

  it("finds the tasks the market does not publish", () => {
    const unique = uniqueVsMarket();
    // The add-on's §5 says "expect roughly a dozen"; applying its own rule
    // (coverage <= 2) to its own audit tables yields 23. The data wins over
    // the summary, as with the 24-vs-26 obligations count. See DECISIONS.md.
    expect(unique.length).toBe(23);
    for (const t of unique) expect(t.competitorCoverage).toBeLessThanOrEqual(2);
    // Sorted rarest-first so the offer leads with the strongest gaps.
    expect(unique[0]!.competitorCoverage).toBe(0);
    // Every task §5 names, except lift doors, which the audit puts at 3.
    for (const key of [
      "becuri",
      "pliante",
      "pubele_readus",
      "plinte",
      "rigole",
      "buruieni",
      "avizier_ordonat",
      "aerisire",
      "raportare_defecte",
      "plante_intrare",
      "copertina",
    ]) {
      expect(unique.some((t) => t.key === key), key).toBe(true);
    }
    expect(TASK_BY_KEY["usi_lift_etaje"]?.competitorCoverage).toBe(3);
  });

  it("groups by zone in reading order and by frequency for the schedule", () => {
    const zones = frequencyTableRo();
    expect(zones.map((g) => g.zone)).toEqual(
      ZONE_ORDER.filter((z) => SERVICE_TASKS.some((t) => t.zone === z))
    );
    expect(zones.reduce((n, g) => n + g.tasks.length, 0)).toBe(SERVICE_TASKS.length);

    const groups = scheduleGroupsRo(tasksForPackage({ hasBasement: true }));
    expect(groups[0]!.frequency).toBe("fiecare_vizita");
    expect(groups[0]!.labelRo).toBe("La fiecare vizită");
  });

  /**
   * The pricing model in src/lib/finance assumes 1.5 h (90 min) per visit.
   * This test measures what the base package actually asks for. It is the
   * loud flag the spec asks for: if it drifts, either the package or the
   * hours assumption is wrong, and the price floor moves with it.
   */
  it("measures the standard 3-floor package against the 1.5 h assumption", () => {
    const standard = tasksForPackage({ hasBasement: true, hasGreen: true });
    const minutes = totalMinutesPerVisit(standard);
    const drift = (minutes - 90) / 90;

    const perVisit: ServiceTask[] = standard.filter(
      (t) => t.defaultFrequency === "fiecare_vizita"
    );
    // Printed on every run so the number is never a surprise.
    console.log(
      `[task catalogue] standard 3-floor walk-up: ${minutes} min/visit across ` +
        `${perVisit.length} every-visit tasks — ${(drift * 100).toFixed(0)}% vs the 90 min ` +
        `pricing assumption.`
    );

    if (Math.abs(drift) > 0.2) {
      console.warn(
        `[task catalogue] WARNING: ${minutes} min/visit is more than 20% from the 90 min ` +
          `assumption used by src/lib/finance. Either trim the base package or raise ` +
          `hoursPerVisit — the price floor depends on it. See DECISIONS.md.`
      );
    }

    // The bound that would mean something is genuinely wrong with the data.
    expect(minutes).toBeGreaterThan(60);
    expect(minutes).toBeLessThan(150);
  });

  it("counts a lift building as more work per visit than a walk-up", () => {
    const walkUp = totalMinutesPerVisit(tasksForPackage({}));
    const withLift = totalMinutesPerVisit(tasksForPackage({ hasLift: true }));
    expect(withLift).toBeGreaterThan(walkUp);
  });

  // Inherited hard rule: dezinfecție is a licensed DDD activity. Naming a task
  // that way claims a certification we do not hold, on a sheet that hangs in a
  // public hallway. `igienizare` is what we actually do and may say.
  it("never names a task as dezinfecție", () => {
    for (const t of SERVICE_TASKS) {
      expect(`${t.key} ${t.nameRo} ${t.nameEn}`.toLowerCase()).not.toMatch(
        /dezinfec|disinfect/
      );
    }
  });
});
