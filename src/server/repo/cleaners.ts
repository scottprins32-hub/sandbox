import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Cleaner = typeof schema.cleaners.$inferSelect;

export async function listActiveCleaners(orgId: string): Promise<Cleaner[]> {
  return getDb()
    .select()
    .from(schema.cleaners)
    .where(and(eq(schema.cleaners.orgId, orgId), eq(schema.cleaners.active, true)));
}

export async function listCleaners(orgId: string): Promise<Cleaner[]> {
  return getDb().select().from(schema.cleaners).where(eq(schema.cleaners.orgId, orgId));
}

export async function getCleaner(orgId: string, id: string): Promise<Cleaner | null> {
  const rows = await getDb()
    .select()
    .from(schema.cleaners)
    .where(and(eq(schema.cleaners.orgId, orgId), eq(schema.cleaners.id, id)));
  return rows[0] ?? null;
}

export async function getCleanerByUserId(orgId: string, userId: string): Promise<Cleaner | null> {
  const rows = await getDb()
    .select()
    .from(schema.cleaners)
    .where(and(eq(schema.cleaners.orgId, orgId), eq(schema.cleaners.userId, userId)));
  return rows[0] ?? null;
}

/** Portal login (§8): phone + the user's 4-digit PIN. */
export async function getCleanerByPhonePin(
  orgId: string,
  phone: string,
  pin: string
): Promise<Cleaner | null> {
  const rows = await getDb()
    .select()
    .from(schema.cleaners)
    .innerJoin(schema.users, eq(schema.cleaners.userId, schema.users.id))
    .where(
      and(
        eq(schema.cleaners.orgId, orgId),
        eq(schema.cleaners.phone, phone),
        eq(schema.users.pin, pin),
        eq(schema.cleaners.active, true)
      )
    );
  return rows[0]?.cleaners ?? null;
}
