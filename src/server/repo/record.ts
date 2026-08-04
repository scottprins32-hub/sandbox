// Building record repo (add-on §6): elements, assessments, the events
// journal and generated annual reports. Org-scoped throughout.

import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "../db";

export type BuildingElement = typeof schema.buildingElements.$inferSelect;
export type ElementAssessment = typeof schema.elementAssessments.$inferSelect;
export type JournalEntry = typeof schema.journalEntries.$inferSelect;
export type AnnualReport = typeof schema.annualReports.$inferSelect;

// ---------------------------------------------------------------- elements

export async function listElements(
  orgId: string,
  buildingId: string
): Promise<BuildingElement[]> {
  return getDb()
    .select()
    .from(schema.buildingElements)
    .where(
      and(
        eq(schema.buildingElements.orgId, orgId),
        eq(schema.buildingElements.buildingId, buildingId)
      )
    );
}

export async function createElements(
  orgId: string,
  rows: Omit<
    typeof schema.buildingElements.$inferInsert,
    "id" | "orgId" | "createdAt" | "updatedAt"
  >[]
): Promise<void> {
  if (rows.length === 0) return;
  await getDb()
    .insert(schema.buildingElements)
    .values(rows.map((r) => ({ orgId, ...r })));
}

// ------------------------------------------------------------- assessments

export async function listAssessments(
  orgId: string,
  buildingElementIds: string[]
): Promise<ElementAssessment[]> {
  if (buildingElementIds.length === 0) return [];
  return getDb()
    .select()
    .from(schema.elementAssessments)
    .where(
      and(
        eq(schema.elementAssessments.orgId, orgId),
        inArray(schema.elementAssessments.buildingElementId, buildingElementIds)
      )
    )
    .orderBy(desc(schema.elementAssessments.assessedAt));
}

export async function createAssessment(
  orgId: string,
  data: Omit<
    typeof schema.elementAssessments.$inferInsert,
    "id" | "orgId" | "createdAt" | "updatedAt"
  >
): Promise<ElementAssessment> {
  const rows = await getDb()
    .insert(schema.elementAssessments)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

// ----------------------------------------------------------------- journal

export async function listJournal(
  orgId: string,
  buildingId: string
): Promise<JournalEntry[]> {
  return getDb()
    .select()
    .from(schema.journalEntries)
    .where(
      and(
        eq(schema.journalEntries.orgId, orgId),
        eq(schema.journalEntries.buildingId, buildingId)
      )
    )
    .orderBy(desc(schema.journalEntries.occurredAt));
}

export async function createJournalEntry(
  orgId: string,
  data: Omit<
    typeof schema.journalEntries.$inferInsert,
    "id" | "orgId" | "createdAt" | "updatedAt"
  >
): Promise<JournalEntry> {
  const rows = await getDb()
    .insert(schema.journalEntries)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

// ---------------------------------------------------------- annual reports

export async function listAnnualReports(
  orgId: string,
  buildingId: string
): Promise<AnnualReport[]> {
  return getDb()
    .select()
    .from(schema.annualReports)
    .where(
      and(
        eq(schema.annualReports.orgId, orgId),
        eq(schema.annualReports.buildingId, buildingId)
      )
    )
    .orderBy(desc(schema.annualReports.year));
}

/** One report per building-year; regeneration replaces the file reference. */
export async function upsertAnnualReport(
  orgId: string,
  data: { buildingId: string; year: number; pdfFileKey: string; generatedAt: number }
): Promise<AnnualReport> {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.annualReports)
    .where(
      and(
        eq(schema.annualReports.orgId, orgId),
        eq(schema.annualReports.buildingId, data.buildingId),
        eq(schema.annualReports.year, data.year)
      )
    );
  if (existing[0]) {
    await db
      .update(schema.annualReports)
      .set({ pdfFileKey: data.pdfFileKey, generatedAt: data.generatedAt })
      .where(eq(schema.annualReports.id, existing[0].id));
    return { ...existing[0], pdfFileKey: data.pdfFileKey, generatedAt: data.generatedAt };
  }
  const rows = await db
    .insert(schema.annualReports)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}
