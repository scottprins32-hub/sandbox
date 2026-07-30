import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Doc = typeof schema.documents.$inferSelect;

export async function listDocuments(orgId: string): Promise<Doc[]> {
  return getDb()
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.orgId, orgId))
    .orderBy(desc(schema.documents.createdAt));
}

export async function createDocument(
  orgId: string,
  data: { title: string; tag: Doc["tag"]; fileKey: string; date?: string | null }
): Promise<Doc> {
  const rows = await getDb()
    .insert(schema.documents)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

export async function deleteDocument(orgId: string, id: string): Promise<Doc | null> {
  const rows = await getDb()
    .delete(schema.documents)
    .where(and(eq(schema.documents.orgId, orgId), eq(schema.documents.id, id)))
    .returning();
  return rows[0] ?? null;
}
