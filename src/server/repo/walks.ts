// Control walks (add-on §5): checkpoints, walks, per-checkpoint evidence rows
// and findings. Org-scoped like every repo. Timestamps for evidence rows are
// stamped here, server-side — client clocks are never trusted; a mutation
// replayed from the offline queue gets the time it landed, which is the
// honest thing to record.

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Checkpoint = typeof schema.checkpoints.$inferSelect;
export type ControlWalk = typeof schema.controlWalks.$inferSelect;
export type WalkCheckpoint = typeof schema.walkCheckpoints.$inferSelect;
export type WalkFinding = typeof schema.walkFindings.$inferSelect;

// ------------------------------------------------------------- checkpoints

export async function listCheckpoints(
  orgId: string,
  buildingId: string
): Promise<Checkpoint[]> {
  const rows = await getDb()
    .select()
    .from(schema.checkpoints)
    .where(
      and(
        eq(schema.checkpoints.orgId, orgId),
        eq(schema.checkpoints.buildingId, buildingId),
        eq(schema.checkpoints.active, true)
      )
    );
  return rows.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getCheckpoint(orgId: string, id: string): Promise<Checkpoint | null> {
  const rows = await getDb()
    .select()
    .from(schema.checkpoints)
    .where(and(eq(schema.checkpoints.orgId, orgId), eq(schema.checkpoints.id, id)));
  return rows[0] ?? null;
}

export async function getCheckpointByCode(
  orgId: string,
  code: string
): Promise<Checkpoint | null> {
  const rows = await getDb()
    .select()
    .from(schema.checkpoints)
    .where(and(eq(schema.checkpoints.orgId, orgId), eq(schema.checkpoints.code, code)));
  return rows[0] ?? null;
}

export async function createCheckpoints(
  orgId: string,
  rows: Omit<typeof schema.checkpoints.$inferInsert, "id" | "orgId" | "createdAt" | "updatedAt">[]
): Promise<void> {
  if (rows.length === 0) return;
  await getDb()
    .insert(schema.checkpoints)
    .values(rows.map((r) => ({ orgId, ...r })));
}

// ------------------------------------------------------------------- walks

export async function getWalk(orgId: string, id: string): Promise<ControlWalk | null> {
  const rows = await getDb()
    .select()
    .from(schema.controlWalks)
    .where(and(eq(schema.controlWalks.orgId, orgId), eq(schema.controlWalks.id, id)));
  return rows[0] ?? null;
}

export async function getWalkForVisit(
  orgId: string,
  visitId: string
): Promise<ControlWalk | null> {
  const rows = await getDb()
    .select()
    .from(schema.controlWalks)
    .where(and(eq(schema.controlWalks.orgId, orgId), eq(schema.controlWalks.visitId, visitId)));
  return rows[0] ?? null;
}

/**
 * Insert-if-missing with a client-generated id, so replays from the Portal's
 * offline queue are harmless.
 */
export async function ensureWalk(
  orgId: string,
  data: { id: string; buildingId: string; visitId: string | null; cleanerId: string }
): Promise<ControlWalk> {
  await getDb()
    .insert(schema.controlWalks)
    .values({ orgId, startedAt: Date.now(), ...data })
    .onConflictDoNothing();
  return (await getWalk(orgId, data.id))!;
}

/** Close the walk. The first finish time wins — evidence is never restamped. */
export async function finishWalk(orgId: string, id: string): Promise<void> {
  await getDb()
    .update(schema.controlWalks)
    .set({ status: "done", finishedAt: Date.now() })
    .where(
      and(
        eq(schema.controlWalks.orgId, orgId),
        eq(schema.controlWalks.id, id),
        isNull(schema.controlWalks.finishedAt)
      )
    );
}

export async function listWalksForBuilding(
  orgId: string,
  buildingId: string
): Promise<ControlWalk[]> {
  return getDb()
    .select()
    .from(schema.controlWalks)
    .where(
      and(
        eq(schema.controlWalks.orgId, orgId),
        eq(schema.controlWalks.buildingId, buildingId)
      )
    )
    .orderBy(desc(schema.controlWalks.startedAt));
}

// --------------------------------------------------------- checkpoint rows

/**
 * Record a checkpoint verification. One row per (walk, checkpoint): a replay
 * or correction updates the existing row rather than duplicating evidence.
 */
export async function recordWalkCheckpoint(
  orgId: string,
  data: {
    controlWalkId: string;
    checkpointId: string;
    condition: "ok" | "issue";
    note?: string | null;
  }
): Promise<WalkCheckpoint> {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.walkCheckpoints)
    .where(
      and(
        eq(schema.walkCheckpoints.orgId, orgId),
        eq(schema.walkCheckpoints.controlWalkId, data.controlWalkId),
        eq(schema.walkCheckpoints.checkpointId, data.checkpointId)
      )
    );
  if (existing[0]) {
    await db
      .update(schema.walkCheckpoints)
      .set({ condition: data.condition, note: data.note ?? existing[0].note })
      .where(eq(schema.walkCheckpoints.id, existing[0].id));
    return (
      await db
        .select()
        .from(schema.walkCheckpoints)
        .where(eq(schema.walkCheckpoints.id, existing[0].id))
    )[0]!;
  }
  const rows = await db
    .insert(schema.walkCheckpoints)
    .values({
      orgId,
      controlWalkId: data.controlWalkId,
      checkpointId: data.checkpointId,
      scannedAt: Date.now(),
      condition: data.condition,
      note: data.note ?? null,
    })
    .returning();
  return rows[0]!;
}

export async function listWalkCheckpoints(
  orgId: string,
  walkIds: string[]
): Promise<WalkCheckpoint[]> {
  if (walkIds.length === 0) return [];
  return getDb()
    .select()
    .from(schema.walkCheckpoints)
    .where(
      and(
        eq(schema.walkCheckpoints.orgId, orgId),
        inArray(schema.walkCheckpoints.controlWalkId, walkIds)
      )
    );
}

/**
 * Append a photo to a checkpoint row of THIS walk. The walk id is part of the
 * predicate: the caller's authorization is on the walk, so a row from another
 * walk must never be reachable through it. Returns false when no row matched.
 */
export async function appendWalkCheckpointPhoto(
  orgId: string,
  controlWalkId: string,
  walkCheckpointId: string,
  fileKey: string
): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.walkCheckpoints)
    .where(
      and(
        eq(schema.walkCheckpoints.orgId, orgId),
        eq(schema.walkCheckpoints.controlWalkId, controlWalkId),
        eq(schema.walkCheckpoints.id, walkCheckpointId)
      )
    );
  const row = rows[0];
  if (!row) return false;
  const keys = row.photoKeys ? (JSON.parse(row.photoKeys) as string[]) : [];
  await db
    .update(schema.walkCheckpoints)
    .set({ photoKeys: JSON.stringify([...keys, fileKey]) })
    .where(eq(schema.walkCheckpoints.id, row.id));
  return true;
}

// ---------------------------------------------------------------- findings

/** Insert-if-missing with a client-generated id (offline replay safety). */
export async function createFinding(
  orgId: string,
  data: {
    id: string;
    controlWalkId: string;
    checkpointId?: string | null;
    category: string;
    severity: "info" | "attention" | "urgent";
    descriptionRo: string;
    reportedTo?: "owner" | "president" | "none";
  }
): Promise<WalkFinding> {
  await getDb()
    .insert(schema.walkFindings)
    .values({
      orgId,
      reportedAt: Date.now(),
      checkpointId: data.checkpointId ?? null,
      reportedTo: data.reportedTo ?? "none",
      ...data,
    })
    .onConflictDoNothing();
  const rows = await getDb()
    .select()
    .from(schema.walkFindings)
    .where(and(eq(schema.walkFindings.orgId, orgId), eq(schema.walkFindings.id, data.id)));
  return rows[0]!;
}

export async function listFindingsForWalks(
  orgId: string,
  walkIds: string[]
): Promise<WalkFinding[]> {
  if (walkIds.length === 0) return [];
  return getDb()
    .select()
    .from(schema.walkFindings)
    .where(
      and(
        eq(schema.walkFindings.orgId, orgId),
        inArray(schema.walkFindings.controlWalkId, walkIds)
      )
    )
    .orderBy(desc(schema.walkFindings.reportedAt));
}

/** Unresolved findings org-wide, with the building they belong to. */
export async function listOpenFindings(
  orgId: string
): Promise<{ finding: WalkFinding; buildingId: string }[]> {
  const findings = await getDb()
    .select()
    .from(schema.walkFindings)
    .where(and(eq(schema.walkFindings.orgId, orgId), isNull(schema.walkFindings.resolvedAt)))
    .orderBy(desc(schema.walkFindings.reportedAt));
  if (findings.length === 0) return [];
  const walks = await getDb()
    .select()
    .from(schema.controlWalks)
    .where(
      and(
        eq(schema.controlWalks.orgId, orgId),
        inArray(
          schema.controlWalks.id,
          [...new Set(findings.map((f) => f.controlWalkId))]
        )
      )
    );
  const buildingByWalk = new Map(walks.map((w) => [w.id, w.buildingId]));
  return findings.map((finding) => ({
    finding,
    buildingId: buildingByWalk.get(finding.controlWalkId) ?? "",
  }));
}

export async function resolveFinding(
  orgId: string,
  id: string,
  resolutionNote?: string | null
): Promise<void> {
  await getDb()
    .update(schema.walkFindings)
    .set({ resolvedAt: Date.now(), resolutionNote: resolutionNote ?? null })
    .where(and(eq(schema.walkFindings.orgId, orgId), eq(schema.walkFindings.id, id)));
}

/** Same walk-scoped discipline as appendWalkCheckpointPhoto. */
export async function appendFindingPhoto(
  orgId: string,
  controlWalkId: string,
  findingId: string,
  fileKey: string
): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.walkFindings)
    .where(
      and(
        eq(schema.walkFindings.orgId, orgId),
        eq(schema.walkFindings.controlWalkId, controlWalkId),
        eq(schema.walkFindings.id, findingId)
      )
    );
  const row = rows[0];
  if (!row) return false;
  const keys = row.photoKeys ? (JSON.parse(row.photoKeys) as string[]) : [];
  await db
    .update(schema.walkFindings)
    .set({ photoKeys: JSON.stringify([...keys, fileKey]) })
    .where(eq(schema.walkFindings.id, row.id));
  return true;
}
