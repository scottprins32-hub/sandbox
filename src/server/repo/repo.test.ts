// Repo-layer tests (§3): run against a throwaway SQLite file. The org_id seam
// is the thing under test — no repo function may leak rows across orgs.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "scara-test-"));
  process.env.SCARA_TEST_CWD = tmpDir;
  // Point the db module at a fresh location by faking cwd for .data resolution.
  const dataDir = path.join(tmpDir, ".data");
  fs.mkdirSync(dataDir, { recursive: true });
  const spy = process.cwd.bind(process);
  process.cwd = () => tmpDir;
  // Copy migrations so the auto-migrate on first connection works.
  fs.cpSync(path.join(spy(), "drizzle"), path.join(tmpDir, "drizzle"), {
    recursive: true,
  });
  // src/assets isn't needed for repo tests.
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("repo layer org scoping", () => {
  it("filters every read by org_id", async () => {
    const { getDb, schema } = await import("../db");
    const db = getDb();

    const [orgA] = await db.insert(schema.orgs).values({ name: "Org A" }).returning();
    const [orgB] = await db.insert(schema.orgs).values({ name: "Org B" }).returning();

    const { createBuilding, listBuildings, getBuilding } = await import("./buildings");
    const a1 = await createBuilding(orgA!.id, {
      label: "A block",
      priceBani: 100_000,
      visitsPerWeek: 2,
      hoursPerVisit: 1.5,
    });
    await createBuilding(orgB!.id, {
      label: "B block",
      priceBani: 200_000,
      visitsPerWeek: 2,
      hoursPerVisit: 1.5,
    });

    expect((await listBuildings(orgA!.id)).map((b) => b.label)).toEqual(["A block"]);
    expect((await listBuildings(orgB!.id)).map((b) => b.label)).toEqual(["B block"]);
    // Cross-org read by id must miss.
    expect(await getBuilding(orgB!.id, a1.id)).toBeNull();
  });

  it("generateWeekVisits is idempotent per building+date", async () => {
    const { getDb, schema } = await import("../db");
    const db = getDb();
    const [org] = await db.insert(schema.orgs).values({ name: "Org C" }).returning();
    const { createBuilding } = await import("./buildings");
    await createBuilding(org!.id, {
      label: "C block",
      priceBani: 100_000,
      visitsPerWeek: 2,
      hoursPerVisit: 1.5,
      status: "active",
    });

    const { generateWeekVisits, listVisitsOnDate } = await import("./visits");
    const first = await generateWeekVisits(org!.id, "2026-07-30");
    const second = await generateWeekVisits(org!.id, "2026-07-30");
    expect(first.created).toBe(2); // Mon + Thu for 2x/week
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(2);
    // Monday of that week is 2026-07-27.
    expect((await listVisitsOnDate(org!.id, "2026-07-27")).length).toBe(1);
  });

  it("prospect pipeline and lead status transitions persist", async () => {
    const { getDb, schema } = await import("../db");
    const db = getDb();
    const [org] = await db.insert(schema.orgs).values({ name: "Org D" }).returning();

    const { createProspect, updateProspect, listProspects } = await import("./prospects");
    const p = await createProspect(org!.id, { label: "Bloc test", commune: "Giroc" });
    await updateProspect(org!.id, p.id, { status: "quoted", quotedPriceBani: 90_000 });
    const [stored] = await listProspects(org!.id);
    expect(stored!.status).toBe("quoted");
    expect(stored!.quotedPriceBani).toBe(90_000);

    const { createLead, setLeadStatus, listLeads } = await import("./leads");
    const lead = await createLead(org!.id, { name: "Test", phone: "0700000000" });
    await setLeadStatus(org!.id, lead.id, "contacted");
    expect((await listLeads(org!.id))[0]!.status).toBe("contacted");
  });
});
