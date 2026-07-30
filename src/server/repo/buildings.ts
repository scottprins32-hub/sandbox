import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Building = typeof schema.buildings.$inferSelect;
export type BuildingInsert = Omit<
  typeof schema.buildings.$inferInsert,
  "id" | "orgId" | "createdAt" | "updatedAt"
>;

export async function listBuildings(
  orgId: string,
  opts?: { status?: Building["status"] }
): Promise<Building[]> {
  const where = opts?.status
    ? and(eq(schema.buildings.orgId, orgId), eq(schema.buildings.status, opts.status))
    : eq(schema.buildings.orgId, orgId);
  return getDb().select().from(schema.buildings).where(where);
}

export async function getBuilding(orgId: string, id: string): Promise<Building | null> {
  const rows = await getDb()
    .select()
    .from(schema.buildings)
    .where(and(eq(schema.buildings.orgId, orgId), eq(schema.buildings.id, id)));
  return rows[0] ?? null;
}

export async function createBuilding(orgId: string, data: BuildingInsert): Promise<Building> {
  const rows = await getDb()
    .insert(schema.buildings)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

export async function updateBuilding(
  orgId: string,
  id: string,
  data: Partial<BuildingInsert>
): Promise<void> {
  await getDb()
    .update(schema.buildings)
    .set(data)
    .where(and(eq(schema.buildings.orgId, orgId), eq(schema.buildings.id, id)));
}
