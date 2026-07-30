import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Contract = typeof schema.contracts.$inferSelect;

export async function listContracts(orgId: string): Promise<Contract[]> {
  return getDb().select().from(schema.contracts).where(eq(schema.contracts.orgId, orgId));
}
