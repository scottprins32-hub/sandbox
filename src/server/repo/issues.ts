import { and, desc, eq, gte, lt } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Issue = typeof schema.issues.$inferSelect;

export async function listIssues(orgId: string, opts?: { openOnly?: boolean }): Promise<Issue[]> {
  const base = eq(schema.issues.orgId, orgId);
  const where = opts?.openOnly
    ? and(base, eq(schema.issues.status, "open"))
    : base;
  return getDb().select().from(schema.issues).where(where).orderBy(desc(schema.issues.createdAt));
}

export async function listIssuesForBuilding(orgId: string, buildingId: string): Promise<Issue[]> {
  return getDb()
    .select()
    .from(schema.issues)
    .where(and(eq(schema.issues.orgId, orgId), eq(schema.issues.buildingId, buildingId)))
    .orderBy(desc(schema.issues.createdAt));
}

/** Issues raised in a window, for measuring the commitments (add-on 2 §C4). */
export async function listIssuesForBuildingBetween(
  orgId: string,
  buildingId: string,
  from: number,
  to: number
): Promise<Issue[]> {
  return getDb()
    .select()
    .from(schema.issues)
    .where(
      and(
        eq(schema.issues.orgId, orgId),
        eq(schema.issues.buildingId, buildingId),
        gte(schema.issues.createdAt, from),
        lt(schema.issues.createdAt, to)
      )
    )
    .orderBy(desc(schema.issues.createdAt));
}

export async function createIssue(
  orgId: string,
  data: {
    buildingId?: string | null;
    source: Issue["source"];
    description: string;
    photoFileKey?: string | null;
    category?: Issue["category"];
    reporterContact?: string | null;
  }
): Promise<Issue> {
  const rows = await getDb()
    .insert(schema.issues)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

/**
 * "Seen, and we are on it" — distinct from resolution, because the commitment
 * we publish is about the first reply, not the fix (§C4).
 */
export async function acknowledgeIssue(orgId: string, id: string): Promise<void> {
  await getDb()
    .update(schema.issues)
    .set({ acknowledgedAt: Date.now() })
    .where(and(eq(schema.issues.orgId, orgId), eq(schema.issues.id, id)));
}

export async function setIssueStatus(
  orgId: string,
  id: string,
  status: Issue["status"]
): Promise<void> {
  // Moving an issue off "open" is itself an acknowledgement: someone read it.
  // Recording it here means the published number cannot drift from what an
  // operator actually did, whichever button they happened to press.
  const now = Date.now();
  const rows = await getDb()
    .select()
    .from(schema.issues)
    .where(and(eq(schema.issues.orgId, orgId), eq(schema.issues.id, id)));
  await getDb()
    .update(schema.issues)
    .set({
      status,
      resolvedAt: status === "done" ? now : null,
      acknowledgedAt: rows[0]?.acknowledgedAt ?? (status === "open" ? null : now),
    })
    .where(and(eq(schema.issues.orgId, orgId), eq(schema.issues.id, id)));
}
