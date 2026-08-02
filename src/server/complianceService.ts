// Orchestration for the compliance layer (add-on §4).
// Seeding, marking done, and the exposure figures the UI and documents share.

import {
  applicableObligations,
  largestExposures,
  maxExposureBani,
  nextDueDate,
  OBLIGATION_BY_KEY,
  statusOf,
  STATUS_ORDER,
  type BuildingFlags,
  type Obligation,
  type ObligationStatus,
} from "@/lib/compliance";
import { todayYmd } from "@/lib/dates";
import { getBuilding, type Building } from "./repo/buildings";
import {
  createBuildingObligations,
  createComplianceEvent,
  getBuildingObligation,
  listBuildingObligations,
  updateBuildingObligation,
  type BuildingObligation,
} from "./repo/compliance";

export function flagsOf(building: Building): BuildingFlags {
  return {
    hasGas: building.hasGas,
    hasLift: building.hasLift,
    hasPlayground: building.hasPlayground,
    hasBasement: building.hasBasement,
  };
}

/**
 * Seed a building's obligations from the catalogue, filtered by its flags.
 * Idempotent: only inserts keys that are not already present, so it is safe to
 * re-run after a building's flags change.
 */
export async function seedBuildingObligations(
  orgId: string,
  buildingId: string
): Promise<{ created: number }> {
  const building = await getBuilding(orgId, buildingId);
  if (!building) return { created: 0 };

  const existing = await listBuildingObligations(orgId, buildingId);
  const have = new Set(existing.map((r) => r.obligationKey));

  const rows = applicableObligations(flagsOf(building))
    .filter((o) => !have.has(o.key))
    .map((o) => ({
      buildingId,
      obligationKey: o.key,
      enabled: true,
      lastDoneAt: null,
      nextDueAt: null,
      // §2.3: only obligations we may lawfully perform default to us.
      responsible: (o.performerRequirement === "us" ? "us" : "third_party") as
        | "us"
        | "client"
        | "third_party",
      contractorId: null,
      notes: null,
    }));

  await createBuildingObligations(orgId, rows);
  return { created: rows.length };
}

export interface ComplianceRow {
  record: BuildingObligation;
  obligation: Obligation;
  status: ObligationStatus;
  nextDue: string | null;
}

/** Joins stored rows to the static catalogue and sorts by urgency. */
export function decorate(
  records: BuildingObligation[],
  now: string = todayYmd()
): ComplianceRow[] {
  return records
    .filter((r) => r.enabled)
    .flatMap((record) => {
      const obligation = OBLIGATION_BY_KEY[record.obligationKey];
      if (!obligation) return []; // catalogue key retired; ignore rather than crash
      return [
        {
          record,
          obligation,
          status: statusOf(obligation, record.lastDoneAt, now),
          nextDue: nextDueDate(obligation, record.lastDoneAt, now),
        },
      ];
    })
    .sort((a, b) => {
      const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (s !== 0) return s;
      return (a.nextDue ?? "9999").localeCompare(b.nextDue ?? "9999");
    });
}

export interface ExposureSummary {
  totalBani: number;
  covered: number;
  total: number;
  largest: { nameRo: string; fineMaxBani: number; buildings: number }[];
}

export async function exposureFor(
  orgId: string,
  buildingId?: string,
  now: string = todayYmd()
): Promise<ExposureSummary> {
  const rows = decorate(await listBuildingObligations(orgId, buildingId), now);
  const entries = rows.map((r) => ({
    obligation: r.obligation,
    lastDoneDate: r.record.lastDoneAt,
  }));
  const covered = rows.filter((r) => r.status === "ok" || r.status === "due_soon").length;
  return {
    totalBani: maxExposureBani(entries, now),
    covered,
    total: rows.length,
    largest: largestExposures(entries, 2, now).map((e) => ({
      nameRo: e.obligation.nameRo,
      fineMaxBani: e.fineMaxBani,
      buildings: e.buildings,
    })),
  };
}

/**
 * Record an obligation as performed. Writes an event, moves last-done and
 * recalculates the cached next-due date.
 */
export async function markObligationDone(
  orgId: string,
  buildingObligationId: string,
  opts: {
    occurredAt?: string;
    performedBy?: "scara" | "contractor" | "client";
    contractorId?: string | null;
    costBani?: number | null;
    documentFileKey?: string | null;
    note?: string | null;
  } = {}
): Promise<void> {
  const record = await getBuildingObligation(orgId, buildingObligationId);
  if (!record) return;
  const obligation = OBLIGATION_BY_KEY[record.obligationKey];
  if (!obligation) return;

  const occurredAt = opts.occurredAt ?? todayYmd();

  await createComplianceEvent(orgId, {
    buildingObligationId,
    kind: "done",
    occurredAt,
    performedBy: opts.performedBy ?? "scara",
    contractorId: opts.contractorId ?? null,
    costBani: opts.costBani ?? null,
    documentFileKey: opts.documentFileKey ?? null,
    photoKeys: null,
    note: opts.note ?? null,
  });

  await updateBuildingObligation(orgId, buildingObligationId, {
    lastDoneAt: occurredAt,
    nextDueAt: nextDueDate(obligation, occurredAt, occurredAt),
  });
}

/** Schedule a treatment against a contractor. */
export async function scheduleObligation(
  orgId: string,
  buildingObligationId: string,
  data: { occurredAt: string; contractorId?: string | null; note?: string | null }
): Promise<void> {
  const record = await getBuildingObligation(orgId, buildingObligationId);
  if (!record) return;
  await createComplianceEvent(orgId, {
    buildingObligationId,
    kind: "scheduled",
    occurredAt: data.occurredAt,
    performedBy: data.contractorId ? "contractor" : "scara",
    contractorId: data.contractorId ?? null,
    costBani: null,
    documentFileKey: null,
    photoKeys: null,
    note: data.note ?? null,
  });
  await updateBuildingObligation(orgId, buildingObligationId, {
    contractorId: data.contractorId ?? record.contractorId,
    nextDueAt: data.occurredAt,
  });
}
