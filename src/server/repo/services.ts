import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type ServiceLine = typeof schema.serviceLines.$inferSelect;
export type BuildingService = typeof schema.buildingServices.$inferSelect;

export async function listServiceLines(orgId: string): Promise<ServiceLine[]> {
  return getDb().select().from(schema.serviceLines).where(eq(schema.serviceLines.orgId, orgId));
}

export async function listBuildingServices(
  orgId: string,
  buildingId?: string
): Promise<BuildingService[]> {
  const where = buildingId
    ? and(
        eq(schema.buildingServices.orgId, orgId),
        eq(schema.buildingServices.buildingId, buildingId)
      )
    : eq(schema.buildingServices.orgId, orgId);
  return getDb().select().from(schema.buildingServices).where(where);
}

export async function attachBuildingService(
  orgId: string,
  data: Omit<
    typeof schema.buildingServices.$inferInsert,
    "id" | "orgId" | "createdAt" | "updatedAt"
  >
): Promise<BuildingService> {
  const rows = await getDb()
    .insert(schema.buildingServices)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

export async function setBuildingServiceActive(
  orgId: string,
  id: string,
  active: boolean
): Promise<void> {
  await getDb()
    .update(schema.buildingServices)
    .set({ active })
    .where(and(eq(schema.buildingServices.orgId, orgId), eq(schema.buildingServices.id, id)));
}

export async function createServiceLines(
  orgId: string,
  rows: Omit<typeof schema.serviceLines.$inferInsert, "id" | "orgId" | "createdAt" | "updatedAt">[]
): Promise<void> {
  if (rows.length === 0) return;
  await getDb()
    .insert(schema.serviceLines)
    .values(rows.map((r) => ({ orgId, ...r })));
}
