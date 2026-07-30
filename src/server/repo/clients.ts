import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Client = typeof schema.clients.$inferSelect;

export async function listClients(orgId: string): Promise<Client[]> {
  return getDb().select().from(schema.clients).where(eq(schema.clients.orgId, orgId));
}

export async function getClient(orgId: string, id: string): Promise<Client | null> {
  const rows = await getDb()
    .select()
    .from(schema.clients)
    .where(and(eq(schema.clients.orgId, orgId), eq(schema.clients.id, id)));
  return rows[0] ?? null;
}

export async function createClient(
  orgId: string,
  data: { name: string; type: Client["type"]; contact?: string; notes?: string }
): Promise<Client> {
  const rows = await getDb()
    .insert(schema.clients)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}
