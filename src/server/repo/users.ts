import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type User = typeof schema.users.$inferSelect;

export async function listUsers(orgId: string): Promise<User[]> {
  return getDb().select().from(schema.users).where(eq(schema.users.orgId, orgId));
}

export async function getUser(orgId: string, id: string): Promise<User | null> {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.orgId, orgId), eq(schema.users.id, id)));
  return rows[0] ?? null;
}
