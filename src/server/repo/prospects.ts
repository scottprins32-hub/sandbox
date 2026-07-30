import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Prospect = typeof schema.prospects.$inferSelect;
export type ProspectStatus = Prospect["status"];

export async function listProspects(orgId: string): Promise<Prospect[]> {
  return getDb()
    .select()
    .from(schema.prospects)
    .where(eq(schema.prospects.orgId, orgId))
    .orderBy(desc(schema.prospects.createdAt));
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
