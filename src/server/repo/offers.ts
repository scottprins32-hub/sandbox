import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Offer = typeof schema.offers.$inferSelect;

export async function listOffers(orgId: string): Promise<Offer[]> {
  return getDb()
    .select()
    .from(schema.offers)
    .where(eq(schema.offers.orgId, orgId))
    .orderBy(desc(schema.offers.createdAt));
}

export async function getOffer(orgId: string, id: string): Promise<Offer | null> {
  const rows = await getDb()
    .select()
    .from(schema.offers)
    .where(and(eq(schema.offers.orgId, orgId), eq(schema.offers.id, id)));
  return rows[0] ?? null;
}

export async function createOffer(
  orgId: string,
  data: Omit<typeof schema.offers.$inferInsert, "id" | "orgId" | "createdAt" | "updatedAt">
): Promise<Offer> {
  const rows = await getDb()
    .insert(schema.offers)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}
