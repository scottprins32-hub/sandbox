import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Protocol = typeof schema.protocols.$inferSelect;

export async function listProtocolsForMonth(orgId: string, monthKey: string): Promise<Protocol[]> {
  return getDb()
    .select()
    .from(schema.protocols)
    .where(and(eq(schema.protocols.orgId, orgId), eq(schema.protocols.month, monthKey)));
}

export async function listProtocolsForBuilding(
  orgId: string,
  buildingId: string
): Promise<Protocol[]> {
  return getDb()
    .select()
    .from(schema.protocols)
    .where(and(eq(schema.protocols.orgId, orgId), eq(schema.protocols.buildingId, buildingId)))
    .orderBy(desc(schema.protocols.month));
}

export async function upsertProtocol(
  orgId: string,
  data: { buildingId: string; month: string; pdfFileKey: string }
): Promise<Protocol> {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.protocols)
    .where(
      and(
        eq(schema.protocols.orgId, orgId),
        eq(schema.protocols.buildingId, data.buildingId),
        eq(schema.protocols.month, data.month)
      )
    );
  if (existing[0]) {
    await db
      .update(schema.protocols)
      .set({ pdfFileKey: data.pdfFileKey, generatedAt: Date.now() })
      .where(eq(schema.protocols.id, existing[0].id));
    return { ...existing[0], pdfFileKey: data.pdfFileKey };
  }
  const rows = await db
    .insert(schema.protocols)
    .values({ orgId, ...data, generatedAt: Date.now() })
    .returning();
  return rows[0]!;
}

export async function markProtocolSigned(
  orgId: string,
  id: string,
  signedFileKey?: string | null
): Promise<void> {
  await getDb()
    .update(schema.protocols)
    .set({ signed: true, signedFileKey: signedFileKey ?? null })
    .where(and(eq(schema.protocols.orgId, orgId), eq(schema.protocols.id, id)));
}

export async function countUnsignedProtocols(orgId: string): Promise<number> {
  const rows = await getDb()
    .select()
    .from(schema.protocols)
    .where(and(eq(schema.protocols.orgId, orgId), eq(schema.protocols.signed, false)));
  return rows.length;
}
