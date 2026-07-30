import { and, desc, eq } from "drizzle-orm";
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

export async function createIssue(
  orgId: string,
  data: {
    buildingId?: string | null;
    source: Issue["source"];
    description: string;
    photoFileKey?: string | null;
  }
): Promise<Issue> {
  const rows = await getDb()
    .insert(schema.issues)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

export async function setIssueStatus(
  orgId: string,
  id: string,
  status: Issue["status"]
): Promise<void> {
  await getDb()
    .update(schema.issues)
    .set({ status, resolvedAt: status === "done" ? Date.now() : null })
    .where(and(eq(schema.issues.orgId, orgId), eq(schema.issues.id, id)));
}
