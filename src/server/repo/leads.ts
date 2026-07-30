import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Lead = typeof schema.leads.$inferSelect;

export async function listLeads(orgId: string): Promise<Lead[]> {
  return getDb()
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.orgId, orgId))
    .orderBy(desc(schema.leads.createdAt));
}

export async function createLead(
  orgId: string,
  data: {
    name: string;
    phone: string;
    email?: string | null;
    locality?: string | null;
    buildingType?: Lead["buildingType"];
    message?: string | null;
    source?: string;
  }
): Promise<Lead> {
  const rows = await getDb()
    .insert(schema.leads)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

export async function setLeadStatus(
  orgId: string,
  id: string,
  status: Lead["status"]
): Promise<void> {
  await getDb()
    .update(schema.leads)
    .set({ status })
    .where(and(eq(schema.leads.orgId, orgId), eq(schema.leads.id, id)));
}

export async function countNewLeads(orgId: string): Promise<number> {
  const rows = await getDb()
    .select()
    .from(schema.leads)
    .where(and(eq(schema.leads.orgId, orgId), eq(schema.leads.status, "new")));
  return rows.length;
}
