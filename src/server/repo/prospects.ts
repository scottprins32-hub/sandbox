import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Prospect = typeof schema.prospects.$inferSelect;
export type ProspectStatus = Prospect["status"];

export async function listProspects(
  orgId: string,
  opts: { routeId?: string } = {}
): Promise<Prospect[]> {
  const where = opts.routeId
    ? and(eq(schema.prospects.orgId, orgId), eq(schema.prospects.routeId, opts.routeId))
    : eq(schema.prospects.orgId, orgId);
  return getDb()
    .select()
    .from(schema.prospects)
    .where(where)
    .orderBy(desc(schema.prospects.createdAt));
}

/**
 * Field capture writes with a client-generated id so a replay from the offline
 * queue updates the same building instead of creating a second one.
 */
export async function upsertProspect(
  orgId: string,
  id: string,
  data: Partial<typeof schema.prospects.$inferInsert> & { label: string }
): Promise<Prospect> {
  const existing = await getProspect(orgId, id);
  const now = Date.now();
  if (existing) {
    await updateProspect(orgId, id, { ...data, lastTouchAt: now });
    return (await getProspect(orgId, id))!;
  }
  const rows = await getDb()
    .insert(schema.prospects)
    .values({ orgId, id, firstSeenAt: now, lastTouchAt: now, ...data })
    .returning();
  return rows[0]!;
}

export async function getProspect(orgId: string, id: string): Promise<Prospect | null> {
  const rows = await getDb()
    .select()
    .from(schema.prospects)
    .where(and(eq(schema.prospects.orgId, orgId), eq(schema.prospects.id, id)));
  return rows[0] ?? null;
}

export async function createProspect(
  orgId: string,
  data: Omit<typeof schema.prospects.$inferInsert, "id" | "orgId" | "createdAt" | "updatedAt">
): Promise<Prospect> {
  const rows = await getDb()
    .insert(schema.prospects)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

export async function updateProspect(
  orgId: string,
  id: string,
  data: Partial<typeof schema.prospects.$inferInsert>
): Promise<void> {
  await getDb()
    .update(schema.prospects)
    .set(data)
    .where(and(eq(schema.prospects.orgId, orgId), eq(schema.prospects.id, id)));
}
